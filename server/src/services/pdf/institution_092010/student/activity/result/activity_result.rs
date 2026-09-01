use std::ffi::OsStr;
use std::sync::OnceLock;
use chrono::Local;
use headless_chrome::{types::PrintToPdfOptions, Browser, LaunchOptions};
use sea_orm::{
    ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter,
};
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
use crate::models::institution::master::units as InstitutionMasterUnit;
use crate::services::image::encode::EncodeService;
use crate::services::pdf::institution_092010::student::activity::plan::activity_plan::{
    AcademicYearInfo, ActivityInfo, ClassCodeInfo, CourseInfo, DetailActivityDto,
    DetailActivityItemDto, GradeInfo, StatusInfo, StudentActivityDto, StudentInfo,
    TeachActivityDto, UnitActivityDto, UnitInfo,
};

static TERA: OnceLock<Tera> = OnceLock::new();

fn get_templates() -> &'static Tera {
    TERA.get_or_init(|| {
        let mut tera = Tera::default();
        let template_content = include_str!("activity_result.html");
        if let Err(e) = tera.add_raw_template("activity_result.html", template_content) {
            eprintln!("Error adding template activity_result.html: {e}");
        }
        tera
    })
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
        student: student.map(|s| StudentInfo {
            id: s.id,
            code: s.code,
            name: s.name,
        }),
        unit: unit.map(|u| UnitInfo {
            id: u.id,
            code: u.code,
            name: u.name,
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

    let server_domain = std::env::var("SERVER_DOMAIN").unwrap_or_else(|_| "localhost".to_string());

    let templates = get_templates();
    let mut context = Context::new();
    context.insert("student_activity", &student_activity_dto);
    context.insert(
        "print_date",
        &Local::now().format("%d-%m-%Y %H:%M:%S").to_string(),
    );
    context.insert("server_domain", &server_domain);

    let rendered = templates.render("activity_result.html", &context)?;
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

fn find_chrome_executable() -> Option<std::path::PathBuf> {
    if let Ok(path) = std::env::var("CHROME_BIN").or_else(|_| std::env::var("CHROMIUM_BIN")) {
        let p = std::path::PathBuf::from(path);
        if p.exists() {
            return Some(p);
        }
    }

    let candidates = [
        "/opt/helium-browser-bin/chrome",
        "/opt/helium-browser-bin/helium",
        "/usr/bin/helium-browser",
        "/usr/bin/google-chrome-stable",
        "/usr/bin/google-chrome",
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
        "/usr/bin/brave",
        "/usr/bin/brave-browser",
        "/usr/bin/edge",
        "/usr/bin/microsoft-edge",
        "/snap/bin/chromium",
        "/app/bin/chromium",
    ];

    for candidate in candidates {
        let p = std::path::PathBuf::from(candidate);
        if p.exists() {
            return Some(p);
        }
    }

    None
}

pub async fn generate_pdf(
    db: &DatabaseConnection,
    activity_id: Uuid,
) -> Result<Vec<u8>, Box<dyn std::error::Error + Send + Sync>> {
    let html_content = generate_html_content(db, activity_id).await?;
    let (header_template, footer_template) = prepare_templates();

    let browser = Browser::new(LaunchOptions {
        path: find_chrome_executable(),
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
