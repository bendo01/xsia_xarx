//! The student-data assistant against the real database (`DATABASE_URL`).
//!
//! These read real roles, students and counsellors and check the access rules end to end, then load every section
//! for real students. They only read, except `audit_rows_have_the_shape_the_migration_creates`, which writes inside a
//! transaction that is never committed. A test whose data is missing in the database says so and passes, so it
//! never fails on an empty database; read the output with `-- --nocapture`. Nothing that identifies a student is printed.

use sea_orm::{ColumnTrait, ConnectionTrait, DatabaseConnection, DbBackend, EntityTrait, QueryFilter, QuerySelect, Statement, TransactionTrait};
use uuid::Uuid;
use xsia_xarx::db::connect_db;
use xsia_xarx::middleware::rbac::{INSTITUTION_WIDE_POSITION_TYPE_IDS, UNIT_SCOPED_POSITION_TYPE_IDS};
use xsia_xarx::models::academic::student::adviser::counsellors;
use xsia_xarx::models::academic::student::campaign::student_activities;
use xsia_xarx::models::academic::student::master::students;
use xsia_xarx::models::auth::role;
use xsia_xarx::models::institution::master::staffes;
use xsia_xarx::services::ai::generation::{GenParams, LlmKind, LlmService};
use xsia_xarx::services::ai::student_assistant::{self, Limits};
use xsia_xarx::services::ai::student_audit;
use xsia_xarx::services::ai::student_data::{self, Wanted};
use xsia_xarx::services::ai::student_scope::{
    self, DataScope, LECTURER_ROLEABLE_TYPE, STAFF_ROLEABLE_TYPE, STUDENT_ROLEABLE_TYPE,
};

async fn db() -> DatabaseConnection {
    connect_db().await.expect("Failed to connect to the database")
}

fn everything() -> DataScope {
    DataScope { profile: true, academic: true, finance: true, sensitive: true, teach_ids: None }
}

async fn role_of(db: &DatabaseConnection, roleable_type: &str, roleable_id: Uuid) -> Option<role::Model> {
    role::Entity::find()
        .filter(role::Column::RoleableType.eq(roleable_type))
        .filter(role::Column::RoleableId.eq(roleable_id))
        .filter(role::Column::DeletedAt.is_null())
        .one(db)
        .await
        .expect("role lookup")
}

/// Roles of one kind whose person still exists
async fn roles_of_students(db: &DatabaseConnection, limit: u64) -> Vec<(role::Model, students::Model)> {
    let roles = role::Entity::find()
        .filter(role::Column::RoleableType.eq(STUDENT_ROLEABLE_TYPE))
        .filter(role::Column::RoleableId.is_not_null())
        .filter(role::Column::DeletedAt.is_null())
        .limit(limit * 5)
        .all(db)
        .await
        .expect("student roles");
    let mut found = Vec::new();
    for r in roles {
        let student = students::Entity::find_by_id(r.roleable_id.expect("filtered"))
            .filter(students::Column::DeletedAt.is_null())
            .one(db)
            .await
            .expect("student lookup");
        if let Some(student) = student {
            found.push((r, student));
        }
        if found.len() as u64 >= limit {
            break;
        }
    }
    found
}

#[tokio::test]
async fn a_student_only_gets_their_own_record() {
    let db = db().await;
    let roles = roles_of_students(&db, 2).await;
    let [(role_a, student_a), (_, student_b)] = roles.as_slice() else {
        println!("SKIPPED: fewer than two student roles with an existing student");
        return;
    };

    // The student names someone else, and nobody at all: both give their own record
    for requested in [Some(student_b.id), None] {
        let (id, scope) = student_scope::authorize_student(&db, role_a, requested).await.expect("a student may read themselves");
        assert_eq!(id, student_a.id, "a forged student id must be ignored");
        assert!(scope.profile && scope.academic && scope.finance && scope.sensitive);
    }
    println!("OK: forged student id ignored");
}

#[tokio::test]
async fn a_lecturer_sees_counsellees_but_not_everyone() {
    let db = db().await;
    let rows = counsellors::Entity::find()
        .filter(counsellors::Column::DeletedAt.is_null())
        .limit(50)
        .all(&db)
        .await
        .expect("counsellors");
    let mut picked = None;
    for row in rows {
        if let Some(role) = role_of(&db, LECTURER_ROLEABLE_TYPE, row.lecturer_id).await {
            picked = Some((role, row));
            break;
        }
    }
    let Some((lecturer_role, row)) = picked else {
        println!("SKIPPED: no counsellor whose lecturer has a role");
        return;
    };

    let (id, scope) = student_scope::authorize_student(&db, &lecturer_role, Some(row.student_id))
        .await
        .expect("a lecturer may read their counsellee");
    assert_eq!(id, row.student_id);
    assert!(scope.profile && scope.finance && scope.sensitive, "a counsellee is readable in full");

    // Somewhere among other students there must be one the lecturer may not see
    let others = students::Entity::find()
        .filter(students::Column::DeletedAt.is_null())
        .filter(students::Column::Id.ne(row.student_id))
        .limit(100)
        .all(&db)
        .await
        .expect("students");
    let mut denied = 0;
    for other in &others {
        if student_scope::authorize_student(&db, &lecturer_role, Some(other.id)).await.is_err() {
            denied += 1;
        }
    }
    println!("OK: lecturer denied {denied} of {} other students", others.len());
    assert!(others.is_empty() || denied > 0, "a lecturer must not see every student");
}

#[tokio::test]
async fn a_program_head_is_limited_to_their_unit() {
    let db = db().await;
    let roles = role::Entity::find()
        .filter(role::Column::PositionTypeId.is_in(UNIT_SCOPED_POSITION_TYPE_IDS.to_vec()))
        .filter(role::Column::RoleableType.eq(STAFF_ROLEABLE_TYPE))
        .filter(role::Column::DeletedAt.is_null())
        .limit(20)
        .all(&db)
        .await
        .expect("program head roles");
    for head_role in roles {
        let Some(staff) = staffes::Entity::find_by_id(head_role.roleable_id.unwrap_or_default())
            .filter(staffes::Column::DeletedAt.is_null())
            .one(&db)
            .await
            .expect("staff")
        else {
            continue;
        };
        let own = students::Entity::find()
            .filter(students::Column::DeletedAt.is_null())
            .filter(students::Column::UnitId.eq(staff.unit_id))
            .one(&db)
            .await
            .expect("own unit student");
        let foreign = students::Entity::find()
            .filter(students::Column::DeletedAt.is_null())
            .filter(students::Column::UnitId.ne(staff.unit_id))
            .one(&db)
            .await
            .expect("other unit student");
        let (Some(own), Some(foreign)) = (own, foreign) else { continue };

        student_scope::authorize_student(&db, &head_role, Some(own.id)).await.expect("own unit is readable");
        assert!(
            student_scope::authorize_student(&db, &head_role, Some(foreign.id)).await.is_err(),
            "another unit must be refused"
        );
        println!("OK: program head sees their unit and not another");
        return;
    }
    println!("SKIPPED: no program head role with students in two units");
}

#[tokio::test]
async fn institution_wide_roles_see_every_unit() {
    let db = db().await;
    let roles = role::Entity::find()
        .filter(role::Column::PositionTypeId.is_in(INSTITUTION_WIDE_POSITION_TYPE_IDS.to_vec()))
        .filter(role::Column::RoleableType.eq(STAFF_ROLEABLE_TYPE))
        .filter(role::Column::DeletedAt.is_null())
        .limit(20)
        .all(&db)
        .await
        .expect("institution-wide roles");
    for wide_role in roles {
        let staff_exists = staffes::Entity::find_by_id(wide_role.roleable_id.unwrap_or_default())
            .filter(staffes::Column::DeletedAt.is_null())
            .one(&db)
            .await
            .expect("staff")
            .is_some();
        if !staff_exists {
            continue;
        }
        let first = students::Entity::find().filter(students::Column::DeletedAt.is_null()).one(&db).await.expect("student");
        let Some(first) = first else { break };
        let other_unit = students::Entity::find()
            .filter(students::Column::DeletedAt.is_null())
            .filter(students::Column::UnitId.ne(first.unit_id))
            .one(&db)
            .await
            .expect("student of another unit");
        let Some(other_unit) = other_unit else { break };
        for student in [&first, &other_unit] {
            student_scope::authorize_student(&db, &wide_role, Some(student.id)).await.expect("institution-wide may read every unit");
        }
        println!("OK: institution-wide role sees two units");
        return;
    }
    println!("SKIPPED: no institution-wide staff role with students in two units");
}

#[tokio::test]
async fn every_section_loads_for_real_students() {
    let db = db().await;
    let with_activity: Vec<Uuid> = student_activities::Entity::find()
        .filter(student_activities::Column::DeletedAt.is_null())
        .select_only()
        .column(student_activities::Column::StudentId)
        .distinct()
        .limit(5)
        .into_tuple()
        .all(&db)
        .await
        .expect("students with activities");
    if with_activity.is_empty() {
        println!("SKIPPED: no student has any semester record");
        return;
    }
    let mut with_index = 0;
    let checked = with_activity.len();
    for id in with_activity {
        let student = students::Entity::find_by_id(id).one(&db).await.expect("student").expect("student of an activity");
        let data = student_data::load(&db, id, &everything(), Wanted::all(), None).await.expect("all sections load");
        let profile = data.profile.as_ref().expect("profile");
        assert_eq!(profile.code, student.code);
        let academic = data.academic.as_ref().expect("academic");
        assert!(!academic.semesters.is_empty(), "a student with semester records has semesters");
        with_index += usize::from(academic.latest_cumulative_index.is_some());
        let sensitive = data.sensitive.as_ref().expect("sensitive");
        assert!(data.finance.is_some() && data.withheld.is_empty());
        println!(
            "OK: semesters={} grades={} theses={} fee_rows={} addresses={} phones={} emails={} relatives={} national_id_present={}",
            academic.semesters.len(),
            academic.grades.len(),
            academic.final_assignment.len(),
            data.finance.as_ref().map_or(0, |f| f.per_semester.len()),
            sensitive.addresses.len(),
            sensitive.phones.len(),
            sensitive.emails.len(),
            sensitive.relatives.len(),
            sensitive.national_id.is_some()
        );
    }
    // Stored indexes are empty for most semesters, so this proves the worked-out ones: most students must have one
    assert!(with_index > 0, "none of {checked} students got an IPK, stored or worked out from grades");
    println!("OK: {with_index} of {checked} students have an IPK");
}

#[tokio::test]
async fn a_scope_withholds_what_it_does_not_allow() {
    let db = db().await;
    let Some(student) = students::Entity::find().filter(students::Column::DeletedAt.is_null()).one(&db).await.expect("student") else {
        println!("SKIPPED: no students");
        return;
    };
    // The scope of a lecturer who only teaches the student
    let class_only = DataScope { profile: false, academic: true, finance: false, sensitive: false, teach_ids: Some(vec![]) };
    let data = student_data::load(&db, student.id, &class_only, Wanted::all(), None).await.expect("load");
    assert!(data.profile.is_none() && data.finance.is_none() && data.sensitive.is_none());
    assert_eq!(data.withheld, vec!["profile", "finance", "sensitive"]);
    let academic = data.academic.expect("academic is allowed");
    assert!(academic.semesters.is_empty() && academic.final_assignment.is_empty() && academic.latest_cumulative_index.is_none());
    println!("OK: class-only scope returns grades only");
}

#[tokio::test]
async fn names_and_numbers_find_the_student() {
    let db = db().await;
    let rows = students::Entity::find().filter(students::Column::DeletedAt.is_null()).limit(30).all(&db).await.expect("students");
    let mut checked = 0;
    for student in rows.iter().filter(|s| s.name.trim().chars().count() >= 5) {
        let same_name = rows.iter().filter(|s| s.name.trim().eq_ignore_ascii_case(student.name.trim())).count();
        if same_name != 1 {
            continue;
        }
        for question in [
            format!("Berapa IPK {}?", student.name.to_uppercase()),
            format!("nilai {} semester ini, ya!", student.name.to_lowercase()),
        ] {
            let found = student_scope::candidates(&db, &question, None).await.expect("candidates");
            assert!(found.contains(&student.id), "a full name in the question must find the student");
        }
        let by_number = student_scope::candidates(&db, &format!("tagihan {}", student.code), None).await.expect("candidates");
        if student_assistant::student_codes(&student.code).len() == 1 {
            assert!(by_number.contains(&student.id), "a student number must find the student");
        }
        checked += 1;
        if checked == 3 {
            break;
        }
    }
    if checked == 0 {
        println!("SKIPPED: no student with a unique name among the first 30");
        return;
    }
    // Numbers stored in groups (`2021 01 123`) are found however the question writes them: as stored, with dots, joined
    let grouped = students::Entity::find()
        .filter(students::Column::DeletedAt.is_null())
        .filter(sea_orm::sea_query::Expr::cust("code ~ '^[0-9]+( [0-9]+)+$'"))
        .limit(3)
        .all(&db)
        .await
        .expect("students with grouped numbers");
    for student in &grouped {
        let same = students::Entity::find().filter(students::Column::Code.eq(student.code.clone())).all(&db).await.expect("same code").len();
        if same != 1 {
            continue;
        }
        for written in [student.code.clone(), student.code.replace(' ', "."), student.code.replace(' ', "")] {
            let found = student_scope::candidates(&db, &format!("Berapa IPK mahasiswa {written}?"), None).await.expect("candidates");
            assert!(found.contains(&student.id), "a grouped student number must be found when written with {written:?} style");
        }
    }
    println!("OK: {} students with grouped numbers found in three writings", grouped.len());

    // Nobody is found in a question that names nobody, and the carried-over student is used instead
    let carried = Uuid::new_v4();
    let nobody = student_scope::candidates(&db, "berapa ipk saya", Some(carried)).await.expect("candidates");
    assert_eq!(nobody, vec![carried]);
    println!("OK: {checked} students found by name and number");
}

#[tokio::test]
async fn audit_rows_have_the_shape_the_migration_creates() {
    let db = db().await;
    let txn = db.begin().await.expect("begin");
    let role_id = Uuid::new_v4();
    student_audit::record(
        &txn,
        &student_audit::Entry {
            user_id: None,
            role_id,
            position_type_id: None,
            student_id: Some(Uuid::new_v4()),
            conversation_id: None,
            outcome: "allowed",
            categories: &["academic", "finance"],
            withheld: &[],
        },
    )
    .await
    .expect("insert into ai.assistant_audits; run ./migration up if the table is missing");

    let row = txn
        .query_one_raw(Statement::from_sql_and_values(
            DbBackend::Postgres,
            "SELECT outcome, array_to_string(categories, ',') AS categories, cardinality(withheld) AS withheld \
             FROM ai.assistant_audits WHERE role_id = $1",
            [role_id.into()],
        ))
        .await
        .expect("select")
        .expect("the row just written");
    assert_eq!(row.try_get::<String>("", "outcome").expect("outcome"), "allowed");
    assert_eq!(row.try_get::<String>("", "categories").expect("categories"), "academic,finance");
    assert_eq!(row.try_get::<i32>("", "withheld").expect("withheld"), 0, "an empty list must stay empty, not hold one empty string");
    // Dropped without commit: the row is rolled back
    println!("OK: audit row written and rolled back");
}

/// Needs the model files and is slow on a CPU: `cargo test --test student_assistant_db_test -- --ignored --nocapture`.
/// Asks the local model what a real student's IPK is and checks it repeats the number in the data
#[tokio::test]
#[ignore]
async fn the_local_model_repeats_the_numbers_in_the_data() {
    let kind = LlmKind::default();
    if !kind.model_path().is_file() || !kind.tokenizer_path().is_file() {
        println!("SKIPPED: model files are missing");
        return;
    }
    let db = db().await;
    let ids: Vec<Uuid> = student_activities::Entity::find()
        .filter(student_activities::Column::DeletedAt.is_null())
        .filter(student_activities::Column::GrandCumulativeIndex.gt(0.0))
        .select_only()
        .column(student_activities::Column::StudentId)
        .distinct()
        .limit(3)
        .into_tuple()
        .all(&db)
        .await
        .expect("students with a stored IPK");
    let llm = LlmService::global(kind).expect("model loads");
    let params = GenParams { temperature: 0.0, max_new_tokens: 140, ..GenParams::default() };

    for id in ids {
        let data = student_data::load(&db, id, &everything(), Wanted { profile: false, academic: true, finance: false, sensitive: false }, None)
            .await
            .expect("load");
        let ipk = data.academic.as_ref().and_then(|a| a.latest_cumulative_index).expect("a cumulative index");
        let context = student_assistant::render_context(&data, Limits::START);
        let prompt = student_assistant::build_prompt(kind, student_assistant::Viewpoint::Own, "Berapa IPK saya?", &context, &[]);
        let tokens = llm.count_tokens(&prompt).expect("count");
        let answer = llm.generate(&prompt, &params, |_| true).expect("generate").text;
        let exact = format!("{ipk:.2}");
        let with_comma = exact.replace('.', ",");
        println!("prompt_tokens={tokens} (budget {}) answer_has_ipk={}", kind.max_prompt_tokens(), answer.contains(&exact) || answer.contains(&with_comma));
        println!("answer: {}", answer.trim());
        assert!(tokens <= kind.max_prompt_tokens() + 200, "the prompt is far over the model's budget");
        assert!(answer.contains(&exact) || answer.contains(&with_comma), "the answer must repeat IPK {exact}");
    }
}

fn model_answer(llm: &LlmService, kind: LlmKind, viewpoint: student_assistant::Viewpoint, question: &str, data: &student_data::StudentData) -> String {
    let params = GenParams { temperature: 0.0, max_new_tokens: 140, ..GenParams::default() };
    let context = student_assistant::render_context(data, Limits::START);
    let prompt = student_assistant::build_prompt(kind, viewpoint, question, &context, &[]);
    llm.generate(&prompt, &params, |_| true).expect("generate").text.trim().to_owned()
}

fn show(label: &str, answer: &str) {
    let flat = answer.replace('\n', " | ");
    println!("  [{label}] {}", flat.chars().take(300).collect::<String>());
}

/// Needs the model files; run with `-- --ignored --nocapture`. Prints each answer so the wording can be read, and
/// checks what can be checked mechanically: whole sentences, the right numbers, the right person, and no invented
/// numbers when data is withheld or missing
#[tokio::test]
#[ignore]
async fn the_local_model_answers_in_sentences() {
    use student_assistant::Viewpoint::{Other, Own};
    let kind = LlmKind::default();
    if !kind.model_path().is_file() || !kind.tokenizer_path().is_file() {
        println!("SKIPPED: model files are missing");
        return;
    }
    let db = db().await;
    let llm = LlmService::global(kind).expect("model loads");
    let ids: Vec<Uuid> = student_activities::Entity::find()
        .filter(student_activities::Column::DeletedAt.is_null())
        .select_only()
        .column(student_activities::Column::StudentId)
        .distinct()
        .limit(40)
        .into_tuple()
        .all(&db)
        .await
        .expect("students with activities");
    let only = |academic: bool, finance: bool, sensitive: bool| Wanted { profile: false, academic, finance, sensitive };
    let words = |text: &str| text.split_whitespace().count();
    let has_digit = |text: &str| text.chars().any(|c| c.is_ascii_digit());
    let mut failures: Vec<String> = Vec::new();

    // A student with an IPK and grades in the latest semester
    let mut graded = None;
    for id in &ids {
        let data = student_data::load(&db, *id, &everything(), only(true, false, false), None).await.expect("load");
        let has = data.academic.as_ref().is_some_and(|a| a.latest_cumulative_index.is_some() && !a.grades.is_empty());
        if has {
            graded = Some((*id, data));
            break;
        }
    }
    let Some((id, data)) = graded else {
        println!("SKIPPED: no student with an IPK and grades among the first 40");
        return;
    };
    let academic = data.academic.as_ref().expect("academic");
    let ipk = academic.latest_cumulative_index.expect("ipk");
    let ipk_text = format!("{ipk:.2}").replace('.', ",");

    println!("IPK, asked by the student");
    let answer = model_answer(llm, kind, Own, "Berapa IPK saya?", &data);
    show("own", &answer);
    if !answer.contains(&ipk_text) { failures.push(format!("own IPK: {ipk_text} missing")); }
    if words(&answer) < 4 { failures.push("own IPK: not a sentence".into()); }
    if !answer.contains("Anda") { failures.push("own IPK: does not address the student as Anda".into()); }

    println!("IPK, asked by a lecturer");
    let answer = model_answer(llm, kind, Other, "Berapa IPK mahasiswa ini?", &data);
    show("other", &answer);
    if !answer.contains(&ipk_text) { failures.push(format!("other IPK: {ipk_text} missing")); }
    if words(&answer) < 4 { failures.push("other IPK: not a sentence".into()); }
    if answer.contains("Anda") { failures.push("other IPK: calls the student Anda".into()); }

    println!("grades of the latest semester");
    let answer = model_answer(llm, kind, Own, "Apa saja nilai saya semester ini?", &data);
    show("grades", &answer);
    let codes: Vec<&str> = academic.grades.iter().take(5).map(|g| g.course_code.as_str()).collect();
    let named = codes.iter().filter(|c| !c.is_empty() && answer.contains(**c)).count();
    let names_named = academic.grades.iter().take(5).filter(|g| !g.course.is_empty() && answer.to_lowercase().contains(&g.course.to_lowercase())).count();
    if named.max(names_named) < codes.len().min(3) { failures.push(format!("grades: only {} of the first {} courses named", named.max(names_named), codes.len())); }

    println!("a fee the caller may not see");
    let blocked = DataScope { profile: true, academic: true, finance: false, sensitive: false, teach_ids: None };
    let withheld = student_data::load(&db, id, &blocked, only(false, true, false), None).await.expect("load");
    assert_eq!(withheld.withheld, vec!["finance"]);
    let answer = model_answer(llm, kind, Other, "Berapa biaya kuliah mahasiswa ini?", &withheld);
    show("withheld", &answer);
    if !answer.to_lowercase().contains("tidak") { failures.push("withheld: does not say it is not allowed".into()); }
    if has_digit(&answer) { failures.push("withheld: invented a number".into()); }

    println!("personal data that was never recorded");
    let mut empty = None;
    for id in &ids {
        let data = student_data::load(&db, *id, &everything(), only(false, false, true), None).await.expect("load");
        let s = data.sensitive.as_ref().expect("sensitive");
        if s.national_id.is_none() && s.addresses.is_empty() && s.phones.is_empty() && s.emails.is_empty() {
            empty = Some(data);
            break;
        }
    }
    match empty {
        Some(data) => {
            let answer = model_answer(llm, kind, Own, "Apa nomor HP dan alamat saya?", &data);
            show("missing", &answer);
            let lower = answer.to_lowercase();
            if !(lower.contains("belum tercatat") || lower.contains("tidak tercatat") || lower.contains("tidak tersedia")) {
                failures.push("missing: does not say it is not recorded".into());
            }
            if has_digit(&answer) { failures.push("missing: invented a number".into()); }
        }
        None => println!("  skip: every student among the first 40 has some personal data"),
    }

    assert!(failures.is_empty(), "answer quality problems:\n{}", failures.join("\n"));
}
