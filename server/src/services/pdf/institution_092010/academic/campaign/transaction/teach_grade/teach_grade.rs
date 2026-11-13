use std::collections::HashMap;
use std::ffi::OsStr;
use std::sync::OnceLock;

use chrono::Local;
use headless_chrome::{types::PrintToPdfOptions, Browser, LaunchOptions};
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder};
use serde::Serialize;
use tera::{Context, Tera};
use uuid::Uuid;

use crate::models::academic::campaign::transaction::activities as Activity;
use crate::models::academic::campaign::transaction::class_codes as ClassCode;
use crate::models::academic::campaign::transaction::grades as Grade;
use crate::models::academic::campaign::transaction::teach_lecturers as TeachLecturer;
use crate::models::academic::campaign::transaction::teaches as Teach;
use crate::models::academic::course::master::course_evaluation_plannings as EvalPlanning;
use crate::models::academic::course::master::courses as Course;
use crate::models::academic::general::reference::academic_years as AcademicYear;
use crate::models::academic::lecturer::master::lecturers as Lecturer;
use crate::models::academic::student::campaign::detail_activities as DetailActivity;
use crate::models::academic::student::campaign::detail_activity_evaluation_components as DetailComponent;
use crate::models::academic::student::campaign::student_activities as StudentActivity;
use crate::models::academic::student::master::students as Student;
use crate::models::institution::master::staffes as Staff;
use crate::models::institution::master::units as Unit;
use crate::models::institution::reference::position_type as PositionType;
use crate::services::pdf::institution_092010::academic::student::activity::result::activity_result::{
    find_chrome_executable, generate_qr_signature, get_signature_image, prepare_templates,
};

/// Blank component columns on the empty sheet when the course has no evaluation planning.
const DEFAULT_COMPONENTS: [&str; 3] = ["Tugas", "UTS", "UAS"];

static TERA: OnceLock<Tera> = OnceLock::new();

fn get_templates() -> &'static Tera {
    TERA.get_or_init(|| {
        let mut tera = Tera::default();
        for (name, content) in [
            ("teach_grade_empty.html", include_str!("teach_grade_empty.html")),
            ("teach_grade_filled.html", include_str!("teach_grade_filled.html")),
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
    name: String,
    percentage: Option<String>,
    /// Numeric weight (0 when unknown), used by the Excel formulas.
    weight: f64,
}

#[derive(Serialize)]
struct GradeScaleRow {
    minimum: f64,
    letter: String,
    point: f64,
}

#[derive(Serialize)]
struct StudentRow {
    code: String,
    name: String,
    /// One entry per column (formatted mark or "-").
    marks: Vec<String>,
    final_mark: Option<String>,
    grade_letter: Option<String>,
    grade_point: Option<String>,
}

fn fmt_num(v: f64) -> String {
    if (v - v.round()).abs() < 1e-9 {
        format!("{}", v.round() as i64)
    } else {
        format!("{v:.2}")
    }
}

async fn build_context(
    db: &DatabaseConnection,
    teach_id: Uuid,
    filled: bool,
) -> Result<serde_json::Value, Box<dyn std::error::Error + Send + Sync>> {
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

    // Evaluation components -> columns.
    let plannings = match course.as_ref() {
        Some(c) => {
            EvalPlanning::Entity::find()
                .filter(EvalPlanning::Column::CourseId.eq(c.id))
                .filter(EvalPlanning::Column::DeletedAt.is_null())
                .order_by_asc(EvalPlanning::Column::Code)
                .all(db)
                .await?
        }
        None => Vec::new(),
    };
    let mut columns: Vec<Column> = plannings
        .iter()
        .map(|p| Column {
            name: p.name.clone(),
            percentage: p.percentage.map(|v| fmt_num(f64::from(v))),
            weight: p.percentage.map_or(0.0, f64::from),
        })
        .collect();
    if !filled && columns.is_empty() {
        columns = DEFAULT_COMPONENTS
            .iter()
            .map(|n| Column { name: (*n).to_string(), percentage: None, weight: 0.0 })
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
        StudentActivity::Entity::find()
            .filter(StudentActivity::Column::Id.is_in(activity_ids))
            .filter(StudentActivity::Column::DeletedAt.is_null())
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

    // student_id -> detail activity of this teach.
    let activity_student: HashMap<Uuid, Uuid> =
        student_activities.iter().map(|a| (a.id, a.student_id)).collect();
    let mut detail_by_student: HashMap<Uuid, &DetailActivity::Model> = HashMap::new();
    for d in &details {
        if let Some(student_id) = activity_student.get(&d.activity_id) {
            detail_by_student.entry(*student_id).or_insert(d);
        }
    }

    let mut grade_letters: HashMap<Uuid, String> = HashMap::new();
    let mut grade_points: HashMap<Uuid, f64> = HashMap::new();
    let mut component_marks: HashMap<(Uuid, Uuid), f32> = HashMap::new();
    if filled {
        let grade_ids: Vec<Uuid> = details.iter().filter_map(|d| d.grade_id).collect();
        if !grade_ids.is_empty() {
            for g in Grade::Entity::find().filter(Grade::Column::Id.is_in(grade_ids)).all(db).await? {
                grade_points.insert(g.id, g.grade);
                grade_letters.insert(g.id, g.alphabet_code.unwrap_or(g.name));
            }
        }
        let detail_ids: Vec<Uuid> = details.iter().map(|d| d.id).collect();
        if !detail_ids.is_empty() {
            let components = DetailComponent::Entity::find()
                .filter(DetailComponent::Column::DetailActivityId.is_in(detail_ids))
                .filter(DetailComponent::Column::DeletedAt.is_null())
                .all(db)
                .await?;
            for c in components {
                if let Some(mark) = c.mark {
                    component_marks.insert((c.detail_activity_id, c.course_evaluation_planning_id), mark);
                }
            }
        }
    }

    let rows: Vec<StudentRow> = students
        .iter()
        .map(|s| {
            let detail = detail_by_student.get(&s.id).copied();
            let mut row = StudentRow {
                code: s.code.clone(),
                name: s.name.clone(),
                marks: Vec::new(),
                final_mark: None,
                grade_letter: None,
                grade_point: None,
            };
            if filled {
                row.marks = plannings
                    .iter()
                    .map(|p| {
                        detail
                            .and_then(|d| component_marks.get(&(d.id, p.id)))
                            .map_or_else(|| "-".to_string(), |m| fmt_num(f64::from(*m)))
                    })
                    .collect();
                row.final_mark = detail.and_then(|d| d.mark).map(fmt_num);
                row.grade_point = detail.and_then(|d| d.grade_id).and_then(|g| grade_points.get(&g).copied()).map(fmt_num);
                row.grade_letter = detail.and_then(|d| d.grade_id).and_then(|g| grade_letters.get(&g).cloned());
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

    // Grading scale of the unit (ascending by minimum score) for the Excel letter lookup.
    let grade_scale: Vec<GradeScaleRow> = match unit.as_ref() {
        Some(u) => Grade::Entity::find()
            .filter(Grade::Column::UnitId.eq(u.id))
            .filter(Grade::Column::DeletedAt.is_null())
            .filter(Grade::Column::EndDate.is_null())
            .order_by_asc(Grade::Column::Minimum)
            .all(db)
            .await?
            .into_iter()
            .map(|g| GradeScaleRow { minimum: g.minimum, letter: g.alphabet_code.unwrap_or(g.name), point: g.grade })
            .collect(),
        None => Vec::new(),
    };
    Ok(serde_json::json!({
        "grade_scale": grade_scale,
        "teach": teach_info,
        "columns": columns,
        "students": rows,
        "lecturer_name": lecturer_name,
        "lecturer_code": lecturer_code,
        "lecturer_signature": lecturer_signature,
        "cs_staff_signature": cs_staff_signature,
        "cs_staff_name": cs_staff_name,
        "cs_staff_code": cs_staff_code,
        "print_date": Local::now().format("%d-%m-%Y %H:%M:%S").to_string(),
    }))
}

pub async fn generate_html_content(
    db: &DatabaseConnection,
    teach_id: Uuid,
    filled: bool,
) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
    let context = Context::from_serialize(&build_context(db, teach_id, filled).await?)?;
    let name = if filled { "teach_grade_filled.html" } else { "teach_grade_empty.html" };
    Ok(get_templates().render(name, &context)?)
}

fn json_str(v: &serde_json::Value) -> String {
    v.as_str().unwrap_or("").to_string()
}

/// Excel grade sheet (same data as the PDF; `filled=false` leaves mark cells blank).
pub async fn generate_xlsx(
    db: &DatabaseConnection,
    teach_id: Uuid,
    filled: bool,
) -> Result<Vec<u8>, Box<dyn std::error::Error + Send + Sync>> {
    use rust_xlsxwriter::{Format, FormatAlign, FormatBorder, Workbook};

    let data = build_context(db, teach_id, filled).await?;
    let empty = Vec::new();
    let columns = data["columns"].as_array().unwrap_or(&empty);
    let students = data["students"].as_array().unwrap_or(&empty);
    let teach = &data["teach"];

    let mut wb = Workbook::new();
    let ws = wb.add_worksheet();
    ws.set_name("Nilai")?;
    let title = Format::new().set_bold().set_font_size(14);
    let bold = Format::new().set_bold();
    let head = Format::new()
        .set_bold()
        .set_border(FormatBorder::Thin)
        .set_align(FormatAlign::Center)
        .set_text_wrap();
    let cell = Format::new().set_border(FormatBorder::Thin);
    let center = Format::new().set_border(FormatBorder::Thin).set_align(FormatAlign::Center);

    ws.write_with_format(0, 0, if filled { "REKAP NILAI PERKULIAHAN" } else { "DAFTAR NILAI PERKULIAHAN" }, &title)?;
    let info = [
        ("Mata Kuliah", format!("{} / {}", json_str(&teach["course"]["code"]), json_str(&teach["course"]["name"]))),
        ("Kelas", json_str(&teach["class_code"]["name"])),
        ("Program Studi", format!("{} / {}", json_str(&teach["unit"]["code"]), json_str(&teach["unit"]["name"]))),
        ("Tahun Akademik", json_str(&teach["academic_year"]["name"])),
        ("Dosen Pengampu", json_str(&data["lecturer_name"])),
        ("Tanggal Cetak", json_str(&data["print_date"])),
    ];
    for (i, (k, v)) in info.iter().enumerate() {
        ws.write_with_format(2 + i as u32, 0, *k, &bold)?;
        ws.write(2 + i as u32, 2, v.as_str())?;
    }

    use rust_xlsxwriter::utility::column_number_to_name;
    use rust_xlsxwriter::Formula;

    let scale = data["grade_scale"].as_array().unwrap_or(&empty);
    let n = columns.len() as u16;
    let weight_row = 8u32; // Excel row 9
    let hr = 9u32; // header, Excel row 10
    let first_col = column_number_to_name(3);
    let last_col = column_number_to_name(2 + n.max(1));
    let final_col = 3 + n;

    // Weights row (editable): label + numeric weight per component + total check.
    ws.write_with_format(weight_row, 2, "Bobot (%)", &bold)?;
    for (i, c) in columns.iter().enumerate() {
        ws.write_with_format(weight_row, 3 + i as u16, c["weight"].as_f64().unwrap_or(0.0), &center)?;
    }
    let total: f64 = columns.iter().map(|c| c["weight"].as_f64().unwrap_or(0.0)).sum();
    if n > 0 {
        let f = Formula::new(format!("=SUM({first_col}9:{last_col}9)")).set_result(fmt_num(total));
        ws.write_formula_with_format(weight_row, final_col, f, &center)?;
        let warn = if (total - 100.0).abs() > 1e-6 { "Total bobot bukan 100" } else { "" };
        let f = Formula::new(format!(
            "=IF(ROUND({}9,2)<>100,\"Total bobot bukan 100\",\"\")",
            column_number_to_name(final_col)
        ))
        .set_result(warn);
        ws.write_formula(weight_row, final_col + 1, f)?;
    }

    for (c, h) in ["No", "NIM", "Nama"].iter().enumerate() {
        ws.write_with_format(hr, c as u16, *h, &head)?;
    }
    for (i, c) in columns.iter().enumerate() {
        let cc = 3 + i as u16;
        ws.write_with_format(hr, cc, json_str(&c["name"]), &head)?;
        ws.set_column_width(cc, 14)?;
    }
    ws.write_with_format(hr, final_col, "Nilai Akhir", &head)?;
    ws.write_with_format(hr, final_col + 1, "Indeks Angka", &head)?;
    ws.write_with_format(hr, final_col + 2, "Indeks Huruf", &head)?;
    ws.set_column_width(final_col, 12)?;
    ws.set_column_width(final_col + 1, 14)?;
    ws.set_column_width(final_col + 2, 14)?;
    ws.set_column_width(1, 16)?;
    ws.set_column_width(2, 34)?;

    // Grading scale sheet used by the letter lookup.
    let has_scale = !scale.is_empty();
    if has_scale {
        let sc = wb.add_worksheet();
        sc.set_name("Skala Nilai")?;
        for (i, h) in ["Nilai Minimum", "Huruf", "Bobot"].iter().enumerate() {
            sc.write_with_format(0, i as u16, *h, &head)?;
        }
        for (i, g) in scale.iter().enumerate() {
            let r = 1 + i as u32;
            sc.write(r, 0, g["minimum"].as_f64().unwrap_or(0.0))?;
            sc.write(r, 1, json_str(&g["letter"]))?;
            sc.write(r, 2, g["point"].as_f64().unwrap_or(0.0))?;
        }
        sc.set_column_width(0, 14)?;
    }
    let ws = wb.worksheet_from_index(0)?;

    for (i, st) in students.iter().enumerate() {
        let r = hr + 1 + i as u32;
        let xr = r + 1; // Excel row number
        ws.write_with_format(r, 0, (i + 1) as f64, &center)?;
        ws.write_with_format(r, 1, json_str(&st["code"]), &cell)?;
        ws.write_with_format(r, 2, json_str(&st["name"]), &cell)?;
        let marks = st["marks"].as_array().unwrap_or(&empty);
        for c in 0..columns.len() {
            let text = marks.get(c).map(json_str).unwrap_or_default();
            let cc = 3 + c as u16;
            match text.parse::<f64>() {
                Ok(v) if filled => ws.write_with_format(r, cc, v, &center)?,
                _ => ws.write_with_format(r, cc, "", &center)?,
            };
        }
        let cached_mark = json_str(&st["final_mark"]).parse::<f64>().unwrap_or(0.0);
        let mark_formula = if n > 0 {
            format!("=ROUND(SUMPRODUCT({first_col}{xr}:{last_col}{xr},{first_col}$9:{last_col}$9)/100,2)")
        } else {
            "=0".to_string()
        };
        let f = Formula::new(mark_formula).set_result(fmt_num(if filled { cached_mark } else { 0.0 }));
        ws.write_formula_with_format(r, final_col, f, &center)?;

        let mark_ref = format!("{}{xr}", column_number_to_name(final_col));
        let letter_cached = if filled { json_str(&st["grade_letter"]) } else { String::new() };
        let point_cached = if filled { json_str(&st["grade_point"]) } else { String::new() };
        if has_scale && n > 0 {
            let last = scale.len() + 1;
            let guard = format!("COUNT({first_col}{xr}:{last_col}{xr})=0");
            let point = Formula::new(format!(
                "=IF({guard},\"\",LOOKUP({mark_ref},'Skala Nilai'!$A$2:$A${last},'Skala Nilai'!$C$2:$C${last}))"
            ));
            let point = match point_cached.parse::<f64>() {
                Ok(v) => point.set_result(fmt_num(v)),
                Err(_) => point.set_result(""),
            };
            ws.write_formula_with_format(r, final_col + 1, point, &center)?;
            // Letter derives from the numeric index, so typing only Indeks Angka also fills it.
            let point_ref = format!("{}{xr}", column_number_to_name(final_col + 1));
            let f = Formula::new(format!(
                "=IF(ISNUMBER({point_ref}),IFERROR(INDEX('Skala Nilai'!$B$2:$B${last},MATCH({point_ref},'Skala Nilai'!$C$2:$C${last},0)),\"\"),\"\")"
            ))
            .set_result(letter_cached);
            ws.write_formula_with_format(r, final_col + 2, f, &center)?;
        } else {
            ws.write_with_format(r, final_col + 1, point_cached, &center)?;
            ws.write_with_format(r, final_col + 2, letter_cached, &center)?;
        }
    }

    Ok(wb.save_to_buffer()?)
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
        tera.add_raw_template("e", include_str!("teach_grade_empty.html")).unwrap();
        tera.add_raw_template("f", include_str!("teach_grade_filled.html")).unwrap();
    }

    #[test]
    fn test_fmt_num() {
        assert_eq!(fmt_num(80.0), "80");
        assert_eq!(fmt_num(77.5), "77.50");
    }
}
