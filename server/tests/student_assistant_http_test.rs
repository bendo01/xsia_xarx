//! `POST /api/v1/ai/assistant/ask` end to end: the real router with its RBAC guard, real users and the local model.
//!
//! A token is made with the application's own JWT secret for users that already have the role active (their
//! `current_role_id`, or their only role), so no password is used and no user is changed. Every scenario is checked and
//! collected, then everything the run wrote (conversations, messages, audit rows of the users it used) is deleted, and
//! only then does the test fail if any check failed. A scenario with no suitable user in the database says so and is
//! skipped. Run it with `-- --ignored --nocapture`; it needs the model files and takes a minute or two.
//! Student names, numbers and personal data are never printed.

use std::collections::BTreeSet;

use chrono::Utc;
use salvo::prelude::*;
use salvo::test::{ResponseExt, TestClient};
use sea_orm::{ColumnTrait, ConnectionTrait, DatabaseConnection, DbBackend, EntityTrait, QueryFilter, Statement};
use serde_json::{Value, json};
use uuid::Uuid;
use xsia_xarx::config::jwt::{JwtConfig, create_token};
use xsia_xarx::controllers;
use xsia_xarx::db::connect_db;
use xsia_xarx::middleware::rbac::{INSTITUTION_WIDE_POSITION_TYPE_IDS, UNIT_SCOPED_POSITION_TYPE_IDS};
use xsia_xarx::models::academic::student::master::students;
use xsia_xarx::models::auth::role;
use xsia_xarx::models::institution::master::staffes;
use xsia_xarx::services::ai::student_data::{self, Wanted};
use xsia_xarx::services::ai::student_scope::{self, DataScope, LECTURER_ROLEABLE_TYPE, STAFF_ROLEABLE_TYPE, STUDENT_ROLEABLE_TYPE};

const URL: &str = "http://127.0.0.1:5800/api/v1/ai/assistant/ask";
/// Position type of Panitia PMB, which `utility:grant-assistant-permission` does not grant
const PANITIA_PMB: Uuid = uuid::uuid!("7955f330-3b26-4d38-b6ec-49dc4d320f16");
const REKTOR: Uuid = uuid::uuid!("e34401db-84ec-450b-bdba-6b9640fc3ae8");
const SENSITIVE_PLACEHOLDER: &str = "[Jawaban memuat data pribadi dan tidak disimpan di riwayat]";

struct InjectDb(DatabaseConnection);

#[salvo::async_trait]
impl Handler for InjectDb {
    async fn handle(&self, req: &mut Request, depot: &mut Depot, res: &mut Response, ctrl: &mut FlowCtrl) {
        depot.insert_typed::<DatabaseConnection>(self.0.clone());
        ctrl.call_next(req, depot, res).await;
    }
}

/// A user acting in one role
struct Persona {
    user_id: Uuid,
    role: role::Model,
    token: String,
}

/// What the endpoint answered
struct Reply {
    status: u16,
    body: String,
}

impl Reply {
    fn events(&self) -> Vec<(String, Value)> {
        self.body
            .replace("\r\n", "\n")
            .split("\n\n")
            .filter_map(|block| {
                let (mut name, mut data) = (None, None);
                for line in block.lines() {
                    if let Some(v) = line.strip_prefix("event:") {
                        name = Some(v.trim().to_owned());
                    } else if let Some(v) = line.strip_prefix("data:") {
                        data = Some(v.trim().to_owned());
                    }
                }
                Some((name?, serde_json::from_str(&data?).ok()?))
            })
            .collect()
    }

    fn event(&self, name: &str) -> Option<Value> {
        self.events().into_iter().find(|(n, _)| n == name).map(|(_, v)| v)
    }

    fn student_id(&self) -> Option<Uuid> {
        self.event("student")?.get("student_id")?.as_str().and_then(|s| Uuid::parse_str(s).ok())
    }

    fn categories(&self) -> Vec<String> {
        self.event("student")
            .and_then(|e| e.get("categories").cloned())
            .and_then(|c| serde_json::from_value(c).ok())
            .unwrap_or_default()
    }

    fn conversation_id(&self) -> Option<Uuid> {
        self.event("student")?.get("conversation_id")?.as_str().and_then(|s| Uuid::parse_str(s).ok())
    }

    fn answer(&self) -> String {
        self.event("done").and_then(|d| d.get("answer").and_then(Value::as_str).map(str::to_owned)).unwrap_or_default()
    }
}

async fn ask(service: &Service, token: Option<&str>, body: Value) -> Reply {
    let mut request = TestClient::post(URL).json(&body);
    if let Some(token) = token {
        request = request.add_header("authorization", format!("Bearer {token}"), true);
    }
    let mut res = request.send(service).await;
    let status = res.status_code.map_or(0, |s| s.as_u16());
    Reply { status, body: res.take_string().await.unwrap_or_default() }
}

/// Conditions that make a user's active role the given role: it is their `current_role_id`, or they have no
/// `current_role_id` and this is their only role (the rules `RbacGuard` applies)
const ACTIVE_ROLE: &str = "u.is_active AND u.deleted_at IS NULL AND r.deleted_at IS NULL AND r.user_id IS NOT NULL \
    AND (u.current_role_id = r.id OR ((u.current_role_id IS NULL OR u.current_role_id = '00000000-0000-0000-0000-000000000000') \
    AND (SELECT count(*) FROM auth.roles x WHERE x.user_id = u.id AND x.deleted_at IS NULL) = 1))";

async fn uuids(db: &DatabaseConnection, sql: &str, columns: &[&str]) -> Option<Vec<Uuid>> {
    let row = db.query_one_raw(Statement::from_string(DbBackend::Postgres, sql.to_owned())).await.expect("query")?;
    columns.iter().map(|c| row.try_get::<Uuid>("", c).ok()).collect()
}

async fn persona(db: &DatabaseConnection, role_id: Uuid, config: &JwtConfig) -> Persona {
    let role = role::Entity::find_by_id(role_id).one(db).await.expect("role").expect("role exists");
    let user_id = role.user_id.expect("a role with a user");
    let token = create_token(user_id, config).expect("token");
    Persona { user_id, role, token }
}

fn in_list(ids: &[Uuid]) -> String {
    ids.iter().map(|id| format!("'{id}'")).collect::<Vec<_>>().join(",")
}

/// A student whose number, written as stored, finds exactly that student
async fn findable(db: &DatabaseConnection, student: &students::Model) -> bool {
    student_scope::candidates(db, &format!("Berapa IPK mahasiswa {}?", student.code), None)
        .await
        .map(|found| found == vec![student.id])
        .unwrap_or(false)
}

async fn some_student(db: &DatabaseConnection, unit: Option<(Uuid, bool)>, not: Uuid) -> Option<students::Model> {
    let mut query = students::Entity::find().filter(students::Column::DeletedAt.is_null()).filter(students::Column::Id.ne(not));
    if let Some((unit_id, same)) = unit {
        query = query.filter(if same { students::Column::UnitId.eq(unit_id) } else { students::Column::UnitId.ne(unit_id) });
    }
    for student in sea_orm::QuerySelect::limit(query, 200).all(db).await.expect("students") {
        if findable(db, &student).await {
            return Some(student);
        }
    }
    None
}

async fn audit_count(db: &DatabaseConnection, user_id: Uuid, outcome: &str, since: &str) -> i64 {
    let row = db
        .query_one_raw(Statement::from_sql_and_values(
            DbBackend::Postgres,
            "SELECT count(*) AS n FROM ai.assistant_audits WHERE user_id = $1 AND outcome = $2 AND created_at >= $3::timestamp",
            [user_id.into(), outcome.into(), since.into()],
        ))
        .await
        .expect("audit count")
        .expect("a row");
    row.try_get::<i64>("", "n").expect("n")
}

struct Run {
    failures: Vec<String>,
}

impl Run {
    fn check(&mut self, scenario: &str, ok: bool, detail: impl FnOnce() -> String) {
        if ok {
            println!("  ok    {scenario}");
        } else {
            let detail = detail();
            println!("  FAIL  {scenario}: {detail}");
            self.failures.push(format!("{scenario}: {detail}"));
        }
    }

    fn skip(&self, scenario: &str, why: &str) {
        println!("  skip  {scenario}: {why}");
    }
}

#[tokio::test]
#[ignore]
async fn the_assistant_endpoint_end_to_end() {
    let db = connect_db().await.expect("Failed to connect to the database");
    let config = JwtConfig::from_env();
    let mut api = Router::with_path("api/v1").hoop(InjectDb(db.clone()));
    api = api.append(&mut controllers::api_routers());
    let service = Service::new(Router::new().push(api));

    let db_started: String = {
        let row = db
            .query_one_raw(Statement::from_string(DbBackend::Postgres, "SELECT now()::timestamp::text AS t".to_owned()))
            .await
            .expect("now")
            .expect("row");
        row.try_get::<String>("", "t").expect("t")
    };
    let app_started = Utc::now().naive_utc();
    let mut run = Run { failures: vec![] };
    let mut used_users: BTreeSet<Uuid> = BTreeSet::new();

    let question_params = |question: &str| json!({ "question": question, "max_new_tokens": 140 });

    // ── Student ──────────────────────────────────────────────────────────────────────────────────────────────
    println!("student");
    let student_sql = format!(
        "SELECT r.id AS c0, s.id AS c1 FROM auth.roles r JOIN auth.users u ON u.id = r.user_id \
         JOIN academic_student_master.students s ON s.id = r.roleable_id AND s.deleted_at IS NULL \
         WHERE r.roleable_type = '{STUDENT_ROLEABLE_TYPE}' AND {ACTIVE_ROLE} \
           AND EXISTS (SELECT 1 FROM academic_student_campaign.student_activities sa \
                       JOIN academic_student_campaign.detail_activities d ON d.activity_id = sa.id AND d.grade_id IS NOT NULL AND d.deleted_at IS NULL \
                       WHERE sa.student_id = s.id AND sa.deleted_at IS NULL) LIMIT 1"
    );
    let student_user = match uuids(&db, &student_sql, &["c0", "c1"]).await {
        Some(ids) => Some((persona(&db, ids[0], &config).await, ids[1])),
        None => None,
    };
    if let Some((student, own_id)) = &student_user {
        used_users.insert(student.user_id);
        let own = students::Entity::find_by_id(*own_id).one(&db).await.expect("student").expect("exists");
        let other = some_student(&db, None, *own_id).await;
        let everything = DataScope { profile: true, academic: true, finance: true, sensitive: true, teach_ids: None };
        let expected_ipk = student_data::load(
            &db,
            *own_id,
            &everything,
            Wanted { profile: false, academic: true, finance: false, sensitive: false },
            None,
        )
        .await
        .expect("load")
        .academic
        .and_then(|a| a.latest_cumulative_index);

        let reply = ask(&service, Some(&student.token), question_params("Berapa IPK saya?")).await;
        run.check("student asks for their IPK", reply.status == 200 && reply.student_id() == Some(own.id), || {
            format!("status {} body {}", reply.status, reply.body.chars().take(200).collect::<String>())
        });
        run.check("the SSE stream has student, token and done events", reply.event("token").is_some() && reply.event("done").is_some(), || {
            "missing events".to_owned()
        });
        if let Some(ipk) = expected_ipk {
            let exact = format!("{ipk:.2}");
            let answer = reply.answer();
            run.check("the answer repeats the IPK in the data", answer.contains(&exact) || answer.contains(&exact.replace('.', ",")), || {
                format!("expected {exact}, got {answer:?}")
            });
            println!("        answer: {}", answer.trim());
        }

        if let Some(other) = &other {
            let forged = json!({ "question": format!("Berapa IPK mahasiswa {}?", other.code), "student_id": other.id, "max_new_tokens": 100 });
            let reply = ask(&service, Some(&student.token), forged).await;
            run.check(
                "a student naming another student by number and id still gets only themselves",
                reply.status == 200 && reply.student_id() == Some(own.id),
                || format!("status {} student {:?}", reply.status, reply.student_id()),
            );
        } else {
            run.skip("forged student", "no other findable student");
        }

        let reply = ask(&service, Some(&student.token), question_params("Berapa tagihan UKT saya?")).await;
        run.check(
            "student asks about their fee",
            reply.status == 200 && reply.categories().iter().any(|c| c == "finance"),
            || format!("status {} categories {:?}", reply.status, reply.categories()),
        );

        let reply = ask(&service, Some(&student.token), question_params("Apa alamat dan nomor HP saya?")).await;
        let stored = match reply.conversation_id() {
            Some(conversation) => {
                let row = db
                    .query_one_raw(Statement::from_sql_and_values(
                        DbBackend::Postgres,
                        "SELECT content FROM ai.messages WHERE conversation_id = $1 AND role = 'assistant'",
                        [conversation.into()],
                    ))
                    .await
                    .expect("message");
                row.and_then(|r| r.try_get::<String>("", "content").ok())
            }
            None => None,
        };
        run.check(
            "an answer with personal data is not kept in the history",
            reply.status == 200 && reply.categories().iter().any(|c| c == "sensitive") && stored.as_deref() == Some(SENSITIVE_PLACEHOLDER),
            || format!("status {} categories {:?} stored {:?}", reply.status, reply.categories(), stored.as_deref().map(|s| s.chars().take(40).collect::<String>())),
        );

        let allowed = audit_count(&db, student.user_id, "allowed", &db_started).await;
        let denied = audit_count(&db, student.user_id, "denied", &db_started).await;
        let expected_allowed = if other.is_some() { 4 } else { 3 };
        run.check("the student's four requests are audited as allowed", allowed == expected_allowed && denied == 0, || {
            format!("allowed {allowed} (expected {expected_allowed}), denied {denied}")
        });
    } else {
        run.skip("student", "no active student user with graded semesters");
    }

    // ── Lecturer ─────────────────────────────────────────────────────────────────────────────────────────────
    println!("lecturer");
    let lecturer_sql = format!(
        "SELECT r.id AS c0, c.student_id AS c1 FROM auth.roles r JOIN auth.users u ON u.id = r.user_id \
         JOIN academic_student_adviser.counsellors c ON c.lecturer_id = r.roleable_id AND c.deleted_at IS NULL \
         JOIN academic_student_master.students s ON s.id = c.student_id AND s.deleted_at IS NULL \
         WHERE r.roleable_type = '{LECTURER_ROLEABLE_TYPE}' AND {ACTIVE_ROLE} LIMIT 1"
    );
    if let Some(ids) = uuids(&db, &lecturer_sql, &["c0", "c1"]).await {
        let lecturer = persona(&db, ids[0], &config).await;
        used_users.insert(lecturer.user_id);
        let counsellee = students::Entity::find_by_id(ids[1]).one(&db).await.expect("student").expect("exists");
        if findable(&db, &counsellee).await {
            let reply = ask(&service, Some(&lecturer.token), question_params(&format!("Berapa IPK mahasiswa {}?", counsellee.code))).await;
            run.check("lecturer asks about their counsellee by number", reply.status == 200 && reply.student_id() == Some(counsellee.id), || {
                format!("status {} student {:?}", reply.status, reply.student_id())
            });
        } else {
            run.skip("lecturer counsellee", "the counsellee's number cannot be found again");
        }

        // A student this lecturer may not see
        let mut unrelated = None;
        let candidates = sea_orm::QuerySelect::limit(
            students::Entity::find().filter(students::Column::DeletedAt.is_null()).filter(students::Column::Id.ne(counsellee.id)),
            200,
        )
        .all(&db)
        .await
        .expect("students");
        for candidate in candidates {
            if findable(&db, &candidate).await && student_scope::authorize_student(&db, &lecturer.role, Some(candidate.id)).await.is_err() {
                unrelated = Some(candidate);
                break;
            }
        }
        match unrelated {
            Some(unrelated) => {
                let reply = ask(&service, Some(&lecturer.token), question_params(&format!("Berapa IPK mahasiswa {}?", unrelated.code))).await;
                run.check("lecturer asks about a student they may not see", reply.status == 400 && reply.body.contains("No student you may see"), || {
                    format!("status {} body {}", reply.status, reply.body.chars().take(160).collect::<String>())
                });
                let denied = audit_count(&db, lecturer.user_id, "denied", &db_started).await;
                run.check("the refusal is audited as denied", denied >= 1, || format!("denied rows: {denied}"));
                // A number nobody has is answered the same way as one that is not theirs
                let reply = ask(&service, Some(&lecturer.token), question_params("Berapa IPK mahasiswa 9999999999?")).await;
                run.check("an unknown number is answered like a forbidden one", reply.status == 400 && reply.body.contains("No student you may see"), || {
                    format!("status {} body {}", reply.status, reply.body.chars().take(160).collect::<String>())
                });
            }
            None => run.skip("lecturer refusal", "no student this lecturer may not see"),
        }
    } else {
        run.skip("lecturer", "no active lecturer user with counsellees");
    }

    // ── Program head (own unit only) ─────────────────────────────────────────────────────────────────────────
    println!("program head");
    let head_sql = format!(
        "SELECT r.id AS c0 FROM auth.roles r JOIN auth.users u ON u.id = r.user_id \
         JOIN institution_master.staffes st ON st.id = r.roleable_id AND st.deleted_at IS NULL \
         WHERE r.roleable_type = '{STAFF_ROLEABLE_TYPE}' AND r.position_type_id IN ({}) AND {ACTIVE_ROLE} LIMIT 1",
        in_list(UNIT_SCOPED_POSITION_TYPE_IDS)
    );
    if let Some(ids) = uuids(&db, &head_sql, &["c0"]).await {
        let head = persona(&db, ids[0], &config).await;
        used_users.insert(head.user_id);
        let unit = staffes::Entity::find_by_id(head.role.roleable_id.expect("staff")).one(&db).await.expect("staff").expect("exists").unit_id;
        match (some_student(&db, Some((unit, true)), Uuid::nil()).await, some_student(&db, Some((unit, false)), Uuid::nil()).await) {
            (Some(own), Some(foreign)) => {
                let reply = ask(&service, Some(&head.token), question_params(&format!("Berapa IPK mahasiswa {}?", own.code))).await;
                run.check("program head asks about a student of their unit", reply.status == 200 && reply.student_id() == Some(own.id), || {
                    format!("status {}", reply.status)
                });
                let reply = ask(&service, Some(&head.token), question_params(&format!("Berapa IPK mahasiswa {}?", foreign.code))).await;
                run.check("program head asks about a student of another unit", reply.status == 400, || format!("status {}", reply.status));
            }
            _ => run.skip("program head", "no findable students in and outside the unit"),
        }
    } else {
        run.skip("program head", "no active program head user");
    }

    // ── Institution-wide (rector) ────────────────────────────────────────────────────────────────────────────
    println!("rector");
    let rector_sql = format!(
        "SELECT r.id AS c0 FROM auth.roles r JOIN auth.users u ON u.id = r.user_id \
         JOIN institution_master.staffes st ON st.id = r.roleable_id AND st.deleted_at IS NULL \
         WHERE r.roleable_type = '{STAFF_ROLEABLE_TYPE}' AND r.position_type_id IN ({}) AND {ACTIVE_ROLE} \
         ORDER BY (r.position_type_id = '{REKTOR}') DESC LIMIT 1",
        in_list(INSTITUTION_WIDE_POSITION_TYPE_IDS)
    );
    if let Some(ids) = uuids(&db, &rector_sql, &["c0"]).await {
        let wide = persona(&db, ids[0], &config).await;
        used_users.insert(wide.user_id);
        if let Some(target) = some_student(&db, None, Uuid::nil()).await {
            let reply = ask(&service, Some(&wide.token), question_params(&format!("Berapa IPK mahasiswa {}?", target.code))).await;
            run.check("an institution-wide role asks about any student", reply.status == 200 && reply.student_id() == Some(target.id), || {
                format!("status {}", reply.status)
            });
        }
    } else {
        run.skip("rector", "no active institution-wide user");
    }

    // ── Refused by RBAC ──────────────────────────────────────────────────────────────────────────────────────
    println!("access control");
    let pmb_sql = format!(
        "SELECT r.id AS c0 FROM auth.roles r JOIN auth.users u ON u.id = r.user_id \
         WHERE r.position_type_id = '{PANITIA_PMB}' AND {ACTIVE_ROLE} LIMIT 1"
    );
    if let Some(ids) = uuids(&db, &pmb_sql, &["c0"]).await {
        let pmb = persona(&db, ids[0], &config).await;
        used_users.insert(pmb.user_id);
        let reply = ask(&service, Some(&pmb.token), question_params("Berapa IPK mahasiswa 12345678?")).await;
        run.check("a role without the permission is refused", reply.status == 403, || format!("status {}", reply.status));
    } else {
        run.skip("role without permission", "no active Panitia PMB user");
    }
    let reply = ask(&service, None, question_params("Berapa IPK saya?")).await;
    run.check("a request without a token is refused", reply.status != 200 && reply.event("student").is_none(), || format!("status {}", reply.status));
    if let Some((student, _)) = &student_user {
        let reply = ask(&service, Some(&student.token), json!({ "question": "ab" })).await;
        run.check("a too short question is a bad request", reply.status == 400, || format!("status {}", reply.status));
        let reply = ask(&service, Some(&student.token), json!({ "question": "Berapa IPK saya?", "sections": ["salary"] })).await;
        run.check("an unknown section is a bad request", reply.status == 400, || format!("status {}", reply.status));
    }

    // ── Clean up everything this run wrote, then judge ───────────────────────────────────────────────────────
    for user_id in &used_users {
        for sql in [
            "DELETE FROM ai.messages WHERE conversation_id IN (SELECT id FROM ai.conversations WHERE user_id = $1 AND created_at >= $2::timestamp)",
            "DELETE FROM ai.conversations WHERE user_id = $1 AND created_at >= $2::timestamp",
        ] {
            db.execute_raw(Statement::from_sql_and_values(DbBackend::Postgres, sql, [(*user_id).into(), app_started.to_string().into()]))
                .await
                .expect("clean up conversations");
        }
        db.execute_raw(Statement::from_sql_and_values(
            DbBackend::Postgres,
            "DELETE FROM ai.assistant_audits WHERE user_id = $1 AND created_at >= $2::timestamp",
            [(*user_id).into(), db_started.clone().into()],
        ))
        .await
        .expect("clean up audits");
    }
    println!("cleaned up the rows of {} user(s)", used_users.len());

    assert!(run.failures.is_empty(), "failed checks:\n{}", run.failures.join("\n"));
}
