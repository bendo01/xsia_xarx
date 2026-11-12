use std::collections::HashMap;
use std::ffi::OsStr;
use std::sync::OnceLock;

use chrono::Local;
use headless_chrome::{types::PrintToPdfOptions, Browser, LaunchOptions};
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder};
use serde::Serialize;
use tera::{Context, Tera};
use uuid::Uuid;

use crate::models::academic::campaign::reference::attend_types as AttendType;
use crate::models::academic::campaign::transaction::activities as Activity;
use crate::models::academic::campaign::transaction::class_codes as ClassCode;
use crate::models::academic::campaign::transaction::teach_attendances as TeachAttendance;
use crate::models::academic::campaign::transaction::teach_lecturers as TeachLecturer;
use crate::models::academic::campaign::transaction::teach_meetings as TeachMeeting;
use crate::models::academic::campaign::transaction::teaches as Teach;
use crate::models::academic::course::master::courses as Course;
use crate::models::academic::general::reference::academic_years as AcademicYear;
use crate::models::academic::lecturer::master::lecturers as Lecturer;
use crate::models::academic::student::campaign::detail_activities as DetailActivity;
use crate::models::academic::student::master::students as Student;
use crate::models::institution::master::staffes as Staff;
use crate::models::institution::master::units as Unit;
use crate::models::institution::reference::position_type as PositionType;
use crate::services::pdf::institution_092010::academic::student::activity::result::activity_result::{
    find_chrome_executable, generate_qr_signature, get_signature_image, prepare_templates,
};

/// Number of blank meeting columns on the empty sheet when no meetings exist yet.
const DEFAULT_MEETING_COLUMNS: usize = 16;

static TERA: OnceLock<Tera> = OnceLock::new();

fn get_templates() -> &'static Tera {
    TERA.get_or_init(|| {
        let mut tera = Tera::default();
        for (name, content) in [
            ("attendence_empty.html", include_str!("attendence_empty.html")),
            ("attendence_filled.html", include_str!("attendence_filled.html")),
        ] {
            if let Err(e) = tera.add_raw_template(name, content) {
                eprintln!("Error adding template {name}: {e}");
            }
        }
        tera
    })
}

#[derive(Serialize)]
struct CodeName {
    code: Option<String>,
    name: Option<String>,
}

#[derive(Serialize)]
struct TeachInfo {
    course: CodeName,
    class_code: CodeName,
    unit: CodeName,
    academic_year: CodeName,
}

#[derive(Serialize)]
struct Column {
    sequence: i32,
    held_on: Option<String>,
}

#[derive(Serialize)]
struct StudentRow {
    code: String,
    name: String,
    /// One entry per column: "present" | "permit" | "absent" | "other".
    cells: Vec<&'static str>,
    present: u32,
    permit: u32,
    absent: u32,
    other: u32,
}

/// Maps `attend_types.alphabet_code` to an icon kind.
fn attend_kind(alphabet_code: &str) -> &'static str {
    match alphabet_code.trim().to_uppercase().as_str() {
        "H" => "present",
        "I" => "permit",
        "A" => "absent",
        _ => "other",
    }
}

pub async fn generate_html_content(
    db: &DatabaseConnection,
    teach_id: Uuid,
    filled: bool,
) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
    let teach = Teach::Entity::find_by_id(teach_id)
        .filter(Teach::Column::DeletedAt.is_null())
        .one(db)
        .await?
        .ok_or_else(|| format!("Teach with id {teach_id} not found"))?;

    let course = Course::Entity::find_by_id(teach.course_id).one(db).await?;
    let class_code = ClassCode::Entity::find_by_id(teach.class_code_id).one(db).await?;
    let unit = match course.as_ref() {
        Some(c) => Unit::Entity::find_by_id(c.unit_id).one(db).await?,
        None => None,
    };
    let academic_year = match teach.activity_id {
        Some(aid) => match Activity::Entity::find_by_id(aid).one(db).await? {
            Some(a) => AcademicYear::Entity::find_by_id(a.academic_year_id).one(db).await?,
            None => None,
        },
        None => None,
    };

    let teach_info = TeachInfo {
        course: CodeName {
            code: course.as_ref().map(|c| c.code.clone()),
            name: course.as_ref().map(|c| c.name.clone()),
        },
        class_code: CodeName {
            code: class_code.as_ref().and_then(|c| c.alphabet_code.clone()),
            name: class_code.as_ref().map(|c| c.name.clone()),
        },
        unit: CodeName {
            code: unit.as_ref().and_then(|u| u.code.clone()),
            name: unit.as_ref().and_then(|u| u.name.clone()),
        },
        academic_year: CodeName {
            code: None,
            name: academic_year.as_ref().map(|a| a.name.clone()),
        },
    };

    // Lecturer (first assigned; prefer home-base lecturer).
    let teach_lecturer = TeachLecturer::Entity::find()
        .filter(TeachLecturer::Column::TeachId.eq(teach_id))
        .filter(TeachLecturer::Column::DeletedAt.is_null())
        .order_by_desc(TeachLecturer::Column::IsLecturerHomeBase)
        .one(db)
        .await?;
    let lecturer = match teach_lecturer.as_ref() {
        Some(tl) => Lecturer::Entity::find_by_id(tl.lecturer_id).one(db).await?,
        None => None,
    };
    let lecturer_name = lecturer.as_ref().and_then(|l| l.name.clone()).unwrap_or_default();
    let lecturer_code = lecturer
        .as_ref()
        .and_then(|l| l.identification_number.clone().or_else(|| Some(l.code.clone())))
        .unwrap_or_default();
    let lecturer_signature = match lecturer.as_ref() {
        Some(l) => {
            let sig = get_signature_image(db, "App\\Model\\Academic\\Lecturer\\Master\\Lecturer", l.id).await;
            if sig.is_empty() {
                let text = format!("Ditandatangani oleh dosen pengampu: {} {}", lecturer_code, lecturer_name);
                generate_qr_signature(&text, None)
            } else {
                sig
            }
        }
        None => String::new(),
    };

    // Meetings -> columns.
    let meetings = TeachMeeting::Entity::find()
        .filter(TeachMeeting::Column::TeachId.eq(teach_id))
        .filter(TeachMeeting::Column::DeletedAt.is_null())
        .order_by_asc(TeachMeeting::Column::Sequence)
        .all(db)
        .await?;
    let mut columns: Vec<Column> = meetings
        .iter()
        .map(|m| Column {
            sequence: m.sequence,
            held_on: m.held_on.map(|d| d.format("%d/%m").to_string()),
        })
        .collect();
    if !filled && columns.is_empty() {
        columns = (1..=DEFAULT_MEETING_COLUMNS as i32)
            .map(|sequence| Column { sequence, held_on: None })
            .collect();
    }

    // Roster: students with a detail activity for this teach.
    let details = DetailActivity::Entity::find()
        .filter(DetailActivity::Column::TeachId.eq(teach_id))
        .filter(DetailActivity::Column::DeletedAt.is_null())
        .all(db)
        .await?;
    let activity_ids: Vec<Uuid> = details.iter().map(|d| d.activity_id).collect();
    let student_activities = if activity_ids.is_empty() {
        Vec::new()
    } else {
        crate::models::academic::student::campaign::student_activities::Entity::find()
            .filter(
                crate::models::academic::student::campaign::student_activities::Column::Id
                    .is_in(activity_ids),
            )
            .filter(
                crate::models::academic::student::campaign::student_activities::Column::DeletedAt
                    .is_null(),
            )
            .all(db)
            .await?
    };
    let student_ids: Vec<Uuid> = student_activities.iter().map(|a| a.student_id).collect();
    let mut students = if student_ids.is_empty() {
        Vec::new()
    } else {
        Student::Entity::find()
            .filter(Student::Column::Id.is_in(student_ids))
            .filter(Student::Column::DeletedAt.is_null())
            .order_by_asc(Student::Column::Code)
            .all(db)
            .await?
    };
    students.dedup_by_key(|s| s.id);

    // Attendance lookup: (student_id, meeting_id) -> kind.
    let attend_types: HashMap<Uuid, &'static str> = AttendType::Entity::find()
        .all(db)
        .await?
        .into_iter()
        .map(|t| (t.id, attend_kind(&t.alphabet_code)))
        .collect();
    let meeting_ids: Vec<Uuid> = meetings.iter().map(|m| m.id).collect();
    let mut lookup: HashMap<(Uuid, Uuid), &'static str> = HashMap::new();
    if filled && !meeting_ids.is_empty() {
        let attendances = TeachAttendance::Entity::find()
            .filter(TeachAttendance::Column::TeachMeetingId.is_in(meeting_ids))
            .filter(TeachAttendance::Column::DeletedAt.is_null())
            .all(db)
            .await?;
        for a in attendances {
            let kind = attend_types.get(&a.attend_type_id).copied().unwrap_or("other");
            lookup.insert((a.student_id, a.teach_meeting_id), kind);
        }
    }

    let rows: Vec<StudentRow> = students
        .iter()
        .map(|s| {
            let mut row = StudentRow {
                code: s.code.clone(),
                name: s.name.clone(),
                cells: Vec::new(),
                present: 0,
                permit: 0,
                absent: 0,
                other: 0,
            };
            if filled {
                for m in &meetings {
                    let kind = lookup.get(&(s.id, m.id)).copied().unwrap_or("other");
                    match kind {
                        "present" => row.present += 1,
                        "permit" => row.permit += 1,
                        "absent" => row.absent += 1,
                        _ => row.other += 1,
                    }
                    row.cells.push(kind);
                }
            }
            row
        })
        .collect();

    // Head of program study signature (PositionType code 10), as in activity_result.
    let (cs_staff_signature, cs_staff_name, cs_staff_code) = match unit.as_ref() {
        Some(u) => {
            let pos = PositionType::Entity::find()
                .filter(PositionType::Column::Code.eq(10))
                .one(db)
                .await?;
            let staff = match pos {
                Some(p) => {
                    Staff::Entity::find()
                        .filter(Staff::Column::UnitId.eq(u.id))
                        .filter(Staff::Column::PositionTypeId.eq(p.id))
                        .filter(Staff::Column::DeletedAt.is_null())
                        .filter(Staff::Column::EndDate.is_null())
                        .one(db)
                        .await?
                }
                None => None,
            };
            match staff {
                Some(s) => {
                    let name = s.name.unwrap_or_default();
                    let code = s.code.unwrap_or_default();
                    let mut sig = get_signature_image(db, "App\\Model\\Institution\\Master\\Staff", s.id).await;
                    if sig.is_empty() {
                        let text = format!("Ditandatangani oleh kepala program studi: {code} {name}");
                        sig = generate_qr_signature(&text, None);
                    }
                    (sig, name, code)
                }
                None => Default::default(),
            }
        }
        None => Default::default(),
    };

    let mut context = Context::new();
    context.insert("teach", &teach_info);
    context.insert("columns", &columns);
    context.insert("students", &rows);
    context.insert("lecturer_name", &lecturer_name);
    context.insert("lecturer_code", &lecturer_code);
    context.insert("lecturer_signature", &lecturer_signature);
    context.insert("cs_staff_signature", &cs_staff_signature);
    context.insert("cs_staff_name", &cs_staff_name);
    context.insert("cs_staff_code", &cs_staff_code);
    context.insert("print_date", &Local::now().format("%d-%m-%Y %H:%M:%S").to_string());

    let name = if filled { "attendence_filled.html" } else { "attendence_empty.html" };
    Ok(get_templates().render(name, &context)?)
}

pub async fn generate_pdf(
    db: &DatabaseConnection,
    teach_id: Uuid,
    filled: bool,
) -> Result<Vec<u8>, Box<dyn std::error::Error + Send + Sync>> {
    let html_content = generate_html_content(db, teach_id, filled).await?;
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
        landscape: Some(true),
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

    Ok(tab.print_to_pdf(Some(pdf_options))?)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_templates_parse() {
        let mut tera = Tera::default();
        tera.add_raw_template("e", include_str!("attendence_empty.html")).unwrap();
        tera.add_raw_template("f", include_str!("attendence_filled.html")).unwrap();
    }

    #[test]
    fn test_attend_kind() {
        assert_eq!(attend_kind("H"), "present");
        assert_eq!(attend_kind("i"), "permit");
        assert_eq!(attend_kind("A"), "absent");
        assert_eq!(attend_kind("S"), "other");
    }
}
