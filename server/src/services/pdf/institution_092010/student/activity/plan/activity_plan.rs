use std::ffi::OsStr;
use std::sync::OnceLock;
use base64::Engine as _;
use chrono::Local;
use headless_chrome::{types::PrintToPdfOptions, Browser, LaunchOptions};
use qrcode::{EcLevel, QrCode};
use sea_orm::{
    ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder,
};
use serde::Serialize;
use tera::{Context, Tera};
use uuid::Uuid;

use crate::models::academic::campaign::transaction::activities as AcademicCampaignTransactionActivity;
use crate::models::academic::campaign::transaction::class_codes as AcademicCampaignTransactionClassCode;
use crate::models::academic::campaign::transaction::grades as AcademicCampaignTransactionGrade;
use crate::models::academic::campaign::transaction::teaches as AcademicCampaignTransactionTeach;
use crate::models::academic::course::master::courses as AcademicCourseMasterCourse;
use crate::models::academic::general::reference::academic_years as AcademicGeneralReferenceAcademicYear;
use crate::models::academic::student::campaign::detail_activities as AcademicStudentCampaignDetailActivity;
use crate::models::academic::student::campaign::student_activities as AcademicStudentCampaignActivity;
use crate::models::academic::student::master::students as AcademicStudentMasterStudent;
use crate::models::academic::student::reference::statuses as AcademicStudentReferenceStatus;
use crate::models::document::transaction::archives as DocumentTransactionArchive;
use crate::models::institution::master::staffes as InstitutionMasterStaff;
use crate::models::institution::master::units as InstitutionMasterUnit;
use crate::models::institution::reference::position_type as InstitutionReferencePositionType;
use crate::models::institution::reference::unit_types as InstitutionReferenceUnitType;
use crate::services::image::encode::EncodeService;

#[derive(Debug, Serialize, Clone)]
pub struct StudentInfo {
    pub id: Uuid,
    pub code: String,
    pub name: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct UnitInfo {
    pub id: Uuid,
    pub code: Option<String>,
    pub name: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct StatusInfo {
    pub id: Uuid,
    pub name: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct AcademicYearInfo {
    pub id: Uuid,
    pub name: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct UnitActivityDto {
    pub id: Uuid,
    pub name: String,
    pub academic_year: Option<AcademicYearInfo>,
    pub unit: Option<UnitInfo>,
}

#[derive(Debug, Serialize, Clone)]
pub struct CourseInfo {
    pub id: Uuid,
    pub code: String,
    pub name: String,
    pub total_credit: f64,
}

#[derive(Debug, Serialize, Clone)]
pub struct GradeInfo {
    pub id: Uuid,
    pub name: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct ClassCodeInfo {
    pub id: Uuid,
    pub alphabet_code: Option<String>,
    pub name: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct TeachActivityDto {
    pub id: Uuid,
    pub class_code: Option<ClassCodeInfo>,
}

#[derive(Debug, Serialize, Clone)]
pub struct DetailActivityItemDto {
    pub id: Uuid,
    pub grade_id: Option<Uuid>,
}

#[derive(Debug, Serialize, Clone)]
pub struct DetailActivityDto {
    pub detail_activity: DetailActivityItemDto,
    pub course: Option<CourseInfo>,
    pub grade: Option<GradeInfo>,
    pub teach_activity: Option<TeachActivityDto>,
}

#[derive(Debug, Serialize, Clone)]
pub struct ActivityInfo {
    pub id: Uuid,
    pub cumulative_index: f64,
    pub grand_cumulative_index: f64,
    pub total_credit: Option<f64>,
    pub grand_total_credit: Option<f64>,
}

#[derive(Debug, Serialize, Clone)]
pub struct StudentActivityDto {
    pub activity: ActivityInfo,
    pub student: Option<StudentInfo>,
    pub unit: Option<UnitInfo>,
    pub status: Option<StatusInfo>,
    pub unit_activity: Option<UnitActivityDto>,
    pub detail_activities: Option<Vec<DetailActivityDto>>,
}

static TERA: OnceLock<Tera> = OnceLock::new();

fn get_templates() -> &'static Tera {
    TERA.get_or_init(|| {
        let mut tera = Tera::default();
        let template_content = include_str!("activity_plan.html");
        if let Err(e) = tera.add_raw_template("activity_plan.html", template_content) {
            eprintln!("Error adding template activity_plan.html: {e}");
        }
        tera
    })
}

async fn get_signature_image(
    db: &DatabaseConnection,
    archiveable_type: &str,
    archiveable_id: Uuid,
) -> String {
    let archive = DocumentTransactionArchive::Entity::find()
        .filter(DocumentTransactionArchive::Column::ArchiveableType.eq(archiveable_type))
        .filter(DocumentTransactionArchive::Column::ArchiveableId.eq(archiveable_id))
        .filter(DocumentTransactionArchive::Column::Mimetype.contains("image"))
        .order_by_desc(DocumentTransactionArchive::Column::CreatedAt)
        .one(db)
        .await;

    match archive {
        Ok(Some(archive)) => {
            let image_path = format!("{}{}", archive.dir, archive.name);
            match EncodeService::base64_encode(&image_path) {
                Ok(base64) => format!(
                    "<img src='data:{};base64,{}' height='50' />",
                    archive.mimetype, base64
                ),
                Err(e) => {
                    eprintln!("Failed to encode signature image at {}: {}", image_path, e);
                    String::new()
                }
            }
        }
        _ => String::new(),
    }
}

pub async fn generate_html_content(
    db: &DatabaseConnection,
    activity_id: Uuid,
) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
    let activity = AcademicStudentCampaignActivity::Entity::find_by_id(activity_id)
        .filter(AcademicStudentCampaignActivity::Column::DeletedAt.is_null())
        .one(db)
        .await?
        .ok_or_else(|| format!("Student activity with id {} not found", activity_id))?;

    let student = AcademicStudentMasterStudent::Entity::find_by_id(activity.student_id)
        .filter(AcademicStudentMasterStudent::Column::DeletedAt.is_null())
        .one(db)
        .await?;

    let unit = match activity.unit_id {
        Some(unit_id) => {
            InstitutionMasterUnit::Entity::find_by_id(unit_id)
                .filter(InstitutionMasterUnit::Column::DeletedAt.is_null())
                .one(db)
                .await?
        }
        None => None,
    };

    let status = AcademicStudentReferenceStatus::Entity::find_by_id(activity.status_id)
        .filter(AcademicStudentReferenceStatus::Column::DeletedAt.is_null())
        .one(db)
        .await?;

    let unit_activity_model = AcademicCampaignTransactionActivity::Entity::find_by_id(activity.unit_activity_id)
        .filter(AcademicCampaignTransactionActivity::Column::DeletedAt.is_null())
        .one(db)
        .await?;

    let unit_activity = match unit_activity_model {
        Some(u_act) => {
            let academic_year = AcademicGeneralReferenceAcademicYear::Entity::find_by_id(u_act.academic_year_id)
                .filter(AcademicGeneralReferenceAcademicYear::Column::DeletedAt.is_null())
                .one(db)
                .await?;
            let u_unit = InstitutionMasterUnit::Entity::find_by_id(u_act.unit_id)
                .filter(InstitutionMasterUnit::Column::DeletedAt.is_null())
                .one(db)
                .await?;
            Some(UnitActivityDto {
                id: u_act.id,
                name: u_act.name,
                academic_year: academic_year.map(|ay| AcademicYearInfo {
                    id: ay.id,
                    name: ay.name,
                }),
                unit: u_unit.map(|u| UnitInfo {
                    id: u.id,
                    code: u.code,
                    name: u.name,
                }),
            })
        }
        None => None,
    };

    let detail_entities = AcademicStudentCampaignDetailActivity::Entity::find()
        .filter(AcademicStudentCampaignDetailActivity::Column::ActivityId.eq(activity.id))
        .filter(AcademicStudentCampaignDetailActivity::Column::DeletedAt.is_null())
        .all(db)
        .await?;

    let mut detail_activities = Vec::new();
    for detail in detail_entities {
        let course = AcademicCourseMasterCourse::Entity::find_by_id(detail.course_id)
            .filter(AcademicCourseMasterCourse::Column::DeletedAt.is_null())
            .one(db)
            .await?;

        let grade = match detail.grade_id {
            Some(gid) => {
                AcademicCampaignTransactionGrade::Entity::find_by_id(gid)
                    .filter(AcademicCampaignTransactionGrade::Column::DeletedAt.is_null())
                    .one(db)
                    .await?
            }
            None => None,
        };

        let teach_activity = match detail.teach_id {
            Some(tid) => {
                let teach = AcademicCampaignTransactionTeach::Entity::find_by_id(tid)
                    .filter(AcademicCampaignTransactionTeach::Column::DeletedAt.is_null())
                    .one(db)
                    .await?;
                match teach {
                    Some(t) => {
                        let class_code = AcademicCampaignTransactionClassCode::Entity::find_by_id(t.class_code_id)
                            .filter(AcademicCampaignTransactionClassCode::Column::DeletedAt.is_null())
                            .one(db)
                            .await?;
                        Some(TeachActivityDto {
                            id: t.id,
                            class_code: class_code.map(|cc| ClassCodeInfo {
                                id: cc.id,
                                alphabet_code: cc.alphabet_code,
                                name: cc.name,
                            }),
                        })
                    }
                    None => None,
                }
            }
            None => None,
        };

        detail_activities.push(DetailActivityDto {
            detail_activity: DetailActivityItemDto {
                id: detail.id,
                grade_id: detail.grade_id,
            },
            course: course.map(|c| CourseInfo {
                id: c.id,
                code: c.code,
                name: c.name,
                total_credit: c.total_credit,
            }),
            grade: grade.map(|g| GradeInfo {
                id: g.id,
                name: g.name,
            }),
            teach_activity,
        });
    }

    let student_activity_dto = StudentActivityDto {
        activity: ActivityInfo {
            id: activity.id,
            cumulative_index: activity.cumulative_index,
            grand_cumulative_index: activity.grand_cumulative_index,
            total_credit: activity.total_credit,
            grand_total_credit: activity.grand_total_credit,
        },
        student: student.as_ref().map(|s| StudentInfo {
            id: s.id,
            code: s.code.clone(),
            name: s.name.clone(),
        }),
        unit: unit.as_ref().map(|u| UnitInfo {
            id: u.id,
            code: u.code.clone(),
            name: u.name.clone(),
        }),
        status: status.map(|st| StatusInfo {
            id: st.id,
            name: st.name,
        }),
        unit_activity,
        detail_activities: if detail_activities.is_empty() {
            None
        } else {
            Some(detail_activities)
        },
    };

    // 1. Student Signature
    let (student_signature, student_name, student_code) = if let Some(ref st) = student {
        let mut sig = get_signature_image(
            db,
            "App\\Model\\Academic\\Student\\Master\\Student",
            st.id,
        )
        .await;

        if sig.is_empty() {
            let signature_text = format!("Ditandatangani oleh mahasiswa: {} {}", st.code, st.name);
            if let Ok(code) = QrCode::with_error_correction_level(&signature_text, EcLevel::L) {
                let image = code.render::<image::Luma<u8>>().build();
                let mut bytes: Vec<u8> = Vec::new();
                let mut cursor = std::io::Cursor::new(&mut bytes);
                if image.write_to(&mut cursor, image::ImageFormat::Png).is_ok() {
                    let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
                    sig = format!("<img src='data:image/png;base64,{}' height='50' />", b64);
                }
            }
        }
        (sig, st.name.clone(), st.code.clone())
    } else {
        (String::new(), String::new(), String::new())
    };

    // 2. Course Department Signature (Head of Program Study - PositionType code 10)
    let (cs_staff_signature, cs_staff_name, cs_staff_code) = if let Some(ref u) = unit {
        let pos_opt = InstitutionReferencePositionType::Entity::find()
            .filter(InstitutionReferencePositionType::Column::Code.eq(10))
            .one(db)
            .await?;

        let staff_opt = if let Some(pos) = pos_opt {
            InstitutionMasterStaff::Entity::find()
                .filter(InstitutionMasterStaff::Column::UnitId.eq(u.id))
                .filter(InstitutionMasterStaff::Column::PositionTypeId.eq(pos.id))
                .filter(InstitutionMasterStaff::Column::DeletedAt.is_null())
                .filter(InstitutionMasterStaff::Column::EndDate.is_null())
                .one(db)
                .await?
        } else {
            None
        };

        match staff_opt {
            Some(staff) => {
                let sig = get_signature_image(db, "App\\Model\\Institution\\Master\\Staff", staff.id).await;
                (
                    sig,
                    staff.name.unwrap_or_default(),
                    staff.code.unwrap_or_default(),
                )
            }
            None => (String::new(), String::new(), String::new()),
        }
    } else {
        (String::new(), String::new(), String::new())
    };

    // 3. BAAK Signature (Head of Academic Bureau - UnitType code 2, PositionType code 18)
    let (baak_signature, baak_name, baak_code) = {
        let bureau_unit_type = InstitutionReferenceUnitType::Entity::find()
            .filter(InstitutionReferenceUnitType::Column::Code.eq(2))
            .one(db)
            .await?;

        let head_position_type = InstitutionReferencePositionType::Entity::find()
            .filter(InstitutionReferencePositionType::Column::Code.eq(18))
            .one(db)
            .await?;

        let staff_opt = if let (Some(u_type), Some(p_type)) = (bureau_unit_type, head_position_type) {
            let bureau_units = InstitutionMasterUnit::Entity::find()
                .filter(InstitutionMasterUnit::Column::UnitTypeId.eq(u_type.id))
                .filter(InstitutionMasterUnit::Column::DeletedAt.is_null())
                .all(db)
                .await?;

            let unit_ids: Vec<Uuid> = bureau_units.into_iter().map(|u| u.id).collect();

            if !unit_ids.is_empty() {
                InstitutionMasterStaff::Entity::find()
                    .filter(InstitutionMasterStaff::Column::UnitId.is_in(unit_ids))
                    .filter(InstitutionMasterStaff::Column::PositionTypeId.eq(p_type.id))
                    .filter(InstitutionMasterStaff::Column::DeletedAt.is_null())
                    .filter(InstitutionMasterStaff::Column::EndDate.is_null())
                    .one(db)
                    .await?
            } else {
                None
            }
        } else {
            None
        };

        match staff_opt {
            Some(staff) => {
                let sig = get_signature_image(db, "App\\Model\\Institution\\Master\\Staff", staff.id).await;
                (
                    sig,
                    staff.name.unwrap_or_default(),
                    staff.code.unwrap_or_default(),
                )
            }
            None => (String::new(), String::new(), String::new()),
        }
    };

    // 4. Empty Signature for Academic Advisor
    let pa_signature = match EncodeService::base64_encode("public/img/empty_signature.png") {
        Ok(base64) => format!("<img src='data:image/png;base64,{}' height='50' />", base64),
        Err(_) => String::new(),
    };

    let server_domain = std::env::var("SERVER_DOMAIN").unwrap_or_else(|_| "localhost".to_string());

    let templates = get_templates();
    let mut context = Context::new();
    context.insert("student_activity", &student_activity_dto);
    context.insert("cs_staff_signature", &cs_staff_signature);
    context.insert("student_signature", &student_signature);
    context.insert("baak_signature", &baak_signature);
    context.insert("pa_signature", &pa_signature);
    context.insert("student_name", &student_name);
    context.insert("student_code", &student_code);
    context.insert("cs_staff_name", &cs_staff_name);
    context.insert("cs_staff_code", &cs_staff_code);
    context.insert("baak_name", &baak_name);
    context.insert("baak_code", &baak_code);
    context.insert(
        "print_date",
        &Local::now().format("%d-%m-%Y %H:%M:%S").to_string(),
    );
    context.insert("server_domain", &server_domain);

    let rendered = templates.render("activity_plan.html", &context)?;
    Ok(rendered)
}

#[must_use]
pub fn prepare_templates() -> (String, String) {
    let logo_base64 = EncodeService::base64_encode("public/img/favicon/092010/android-chrome-512x512.png")
        .or_else(|_| EncodeService::base64_encode("public/img/logo/092010/android-chrome-512x512.png"))
        .unwrap_or_default();

    let header_template = format!(
        r#"
            <div style="width: 100%; clear: both; display: block;">
                <div id="pageHeader" style="width: 100%; clear: both; margin: 0px; padding: 0px; display: block; margin-top: -30px; padding-bottom: 15px;">
                    <div style="width: 100%; padding-top: 35px; margin-left: 30px; margin-right: 30px; display: block; clear: both;">
                        <div style="float:left; width:20%;">
                            <img src="data:image/png;base64, {logo_base64}" height="90" width="90" />
                        </div>
                        <div style="width: 80%;">
                            <p style="text-transform: uppercase; font-size: 18px; color: rgb(0, 0, 255); margin-top: 12px; padding-top: 0px; margin-bottom: 0px; padding-bottom: 0px; font-weight: 700; text-align: center;">
                                INSTITUT TEKNOLOGI DAN KESEHATAN
                            </p>
                            <p style="text-transform: uppercase; font-size: 18px; color: rgb(255, 0, 0); margin-top: 0px; padding-top: 0px; margin-bottom: 0px; padding-bottom: 0px; font-weight: 700; text-align: center;">
                                TRI TUNAS NASIONAL
                            </p>
                            <p style="font-size: 8px; color: rgb(0 0 0); margin-top: 0px; padding-top: 0px; margin-bottom: 0px; padding-bottom: 0px; font-weight: 700; text-align: center;">
                                SK Kemendikbud Republik Indonesia Nomor 890/M/2020 Tanggal 21 September 2020
                            </p>
                            <p style="font-size: 8px; color: rgb(0 0 0); margin-top: 0px; padding-top: 0px; margin-bottom: 0px; padding-bottom: 0px; font-weight: 700; text-align: center;">
                                Jalan Tamangapa Raya No.168, Bangkala, Kec.Manggala, Kota Makassar 90235
                            </p>
                            <p style="font-size: 8px; color: rgb(0 0 0); margin-top: 0px; padding-top: 0px; margin-bottom: 0px; padding-bottom: 0px; font-weight: 700; text-align: center;">
                                Email: official@tritunas.ac.id
                            </p>
                        </div>
                    </div>
                </div>
                <hr style="margin-left: 30px; margin-right: 30px; border-width: 0.5px; border-style: solid; border-color: #C0C0C0;">
            </div>
        "#
    );

    let footer_template = r#"
            <div id="pageFooter" style="width: 100%; text-align: right; font-size: 8px; padding-right: 10px;">
                Halaman <span class="pageNumber"></span> dari <span class="totalPages"></span>
            </div>
        "#
    .to_string();

    (header_template, footer_template)
}

pub async fn generate_pdf(
    db: &DatabaseConnection,
    activity_id: Uuid,
) -> Result<Vec<u8>, Box<dyn std::error::Error + Send + Sync>> {
    let html_content = generate_html_content(db, activity_id).await?;
    let (header_template, footer_template) = prepare_templates();

    let browser = Browser::new(LaunchOptions {
        args: vec![
            OsStr::new("--allow-file-access-from-files"),
            OsStr::new("--no-sandbox"),
            OsStr::new("--disable-gpu"),
            OsStr::new("--disable-dev-shm-usage"),
        ],
        ..Default::default()
    })?;

    let tab = browser.new_tab()?;
    let content_url = format!("data:text/html,{}", urlencoding::encode(&html_content));
    tab.navigate_to(&content_url)?;
    tab.wait_until_navigated()?;

    let pdf_options = PrintToPdfOptions {
        display_header_footer: Some(true),
        header_template: Some(header_template),
        footer_template: Some(footer_template),
        print_background: Some(true),
        margin_top: Some(1.9),
        margin_bottom: Some(1.0),
        margin_left: Some(0.5),
        margin_right: Some(0.5),
        ..Default::default()
    };

    let pdf = tab.print_to_pdf(Some(pdf_options))?;
    Ok(pdf)
}
