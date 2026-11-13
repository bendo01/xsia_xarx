//! Class meetings (16 per class: #8 midterm, #16 final) and student attendance.
//!
//! Two ways to record attendance, both pushed over WebSocket:
//! 1. the lecturer sets each student's status (`save_attendances`)
//! 2. the lecturer shows a rotating QR code and students scan it (`open_qr` / `qr_token` / `scan`)

use std::collections::HashMap;
use std::sync::{LazyLock, Mutex};

use chrono::{Duration, Utc};
use salvo::oapi::ToSchema;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder, Set,
    TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::controllers::realtime::publish_event;
use crate::middleware::auth::auth_user_id;
use crate::models::academic::campaign::reference::attend_types;
use crate::models::academic::campaign::transaction::{teach_attendances as att_mod, teach_meetings as meet_mod, teaches};
use crate::models::academic::student::campaign::{detail_activities, student_activities};
use crate::models::academic::student::master::students;
use crate::services::auth::data_scope::DataScope;

pub const MEETINGS_PER_TEACH: i32 = 16;
pub const MIDTERM_SEQUENCE: i32 = 8;
pub const FINAL_SEQUENCE: i32 = 16;
/// `attend_types.alphabet_code` marking "present"; this is what a successful QR scan records.
pub const PRESENT_ALPHABET_CODE: &str = "H";

/// A QR token lives this long before the next one replaces it.
const QR_TOKEN_TTL_SECS: i64 = 30;
/// The previous token stays valid for this long after rotation (scan in progress while rotating).
const QR_TOKEN_GRACE_SECS: i64 = 10;
const QR_DEFAULT_OPEN_MINUTES: i64 = 15;

fn internal<E: ToString>(e: E) -> StatusError {
    StatusError::internal_server_error().brief(e.to_string())
}

fn meeting_type_for(sequence: i32) -> &'static str {
    match sequence {
        MIDTERM_SEQUENCE => "midterm",
        FINAL_SEQUENCE => "final",
        _ => "regular",
    }
}

// ── QR tokens (in memory, random, rotating) ──────────────────────────────────

struct QrState {
    current: String,
    previous: Option<(String, chrono::DateTime<Utc>)>,
    rotated_at: chrono::DateTime<Utc>,
}

static QR_TOKENS: LazyLock<Mutex<HashMap<Uuid, QrState>>> = LazyLock::new(|| Mutex::new(HashMap::new()));

/// Current token for the meeting, rotating it when it is older than the TTL.
fn current_qr_token(meeting_id: Uuid) -> (String, i64) {
    let now = Utc::now();
    let mut map = QR_TOKENS.lock().unwrap();
    let state = map.entry(meeting_id).or_insert_with(|| QrState {
        current: Uuid::new_v4().simple().to_string(),
        previous: None,
        rotated_at: now,
    });
    if (now - state.rotated_at).num_seconds() >= QR_TOKEN_TTL_SECS {
        let old = std::mem::replace(&mut state.current, Uuid::new_v4().simple().to_string());
        state.previous = Some((old, now));
        state.rotated_at = now;
    }
    let remaining = QR_TOKEN_TTL_SECS - (now - state.rotated_at).num_seconds();
    (state.current.clone(), remaining.max(1))
}

/// Meeting a token belongs to, if it is the current (or just-rotated) token.
fn meeting_for_qr_token(token: &str) -> Option<Uuid> {
    let now = Utc::now();
    let map = QR_TOKENS.lock().unwrap();
    map.iter().find_map(|(meeting_id, state)| {
        let current_ok = state.current == token && (now - state.rotated_at).num_seconds() < QR_TOKEN_TTL_SECS + QR_TOKEN_GRACE_SECS;
        let previous_ok = state
            .previous
            .as_ref()
            .is_some_and(|(t, rotated)| t == token && (now - *rotated).num_seconds() < QR_TOKEN_GRACE_SECS);
        (current_ok || previous_ok).then_some(*meeting_id)
    })
}

fn forget_qr_token(meeting_id: Uuid) {
    QR_TOKENS.lock().unwrap().remove(&meeting_id);
}

// ── DTOs ─────────────────────────────────────────────────────────────────────

#[derive(Serialize, ToSchema)]
pub struct MeetingResponse {
    pub id: Uuid,
    pub teach_id: Uuid,
    pub sequence: i32,
    pub meeting_type: String,
    pub topic: Option<String>,
    pub held_on: Option<chrono::NaiveDate>,
    pub is_qr_open: bool,
    pub qr_open_until: Option<chrono::NaiveDateTime>,
}

impl From<meet_mod::Model> for MeetingResponse {
    fn from(m: meet_mod::Model) -> Self {
        let is_qr_open = m.qr_open_until.is_some_and(|t| t > Utc::now().naive_utc());
        Self {
            id: m.id,
            teach_id: m.teach_id,
            sequence: m.sequence,
            meeting_type: m.meeting_type,
            topic: m.topic,
            held_on: m.held_on,
            is_qr_open,
            qr_open_until: m.qr_open_until,
        }
    }
}

#[derive(Serialize, Clone, ToSchema)]
pub struct AttendTypeOption {
    pub id: Uuid,
    pub code: i32,
    pub alphabet_code: String,
    pub name: String,
}

impl From<attend_types::Model> for AttendTypeOption {
    fn from(m: attend_types::Model) -> Self {
        Self { id: m.id, code: m.code, alphabet_code: m.alphabet_code, name: m.name }
    }
}

#[derive(Serialize, ToSchema)]
pub struct RosterEntry {
    pub student_id: Uuid,
    pub student_name: String,
    pub student_code: String,
    /// `None` until attendance has been recorded for this student
    pub attend_type_id: Option<Uuid>,
    pub method: Option<String>,
    pub marked_at: Option<chrono::NaiveDateTime>,
}

#[derive(Serialize, ToSchema)]
pub struct RosterResponse {
    pub attend_types: Vec<AttendTypeOption>,
    pub entries: Vec<RosterEntry>,
}

#[derive(Deserialize, ToSchema)]
pub struct AttendanceEntry {
    pub student_id: Uuid,
    pub attend_type_id: Uuid,
}

#[derive(Deserialize, ToSchema)]
pub struct SaveAttendancesRequest {
    pub entries: Vec<AttendanceEntry>,
}

#[derive(Deserialize, ToSchema, Default)]
pub struct OpenQrRequest {
    pub minutes: Option<i64>,
}

#[derive(Serialize, ToSchema)]
pub struct QrTokenResponse {
    pub token: String,
    pub expires_in: i64,
}

#[derive(Deserialize, ToSchema)]
pub struct ScanRequest {
    pub token: String,
}

#[derive(Serialize, ToSchema)]
pub struct ScanResponse {
    pub meeting_id: Uuid,
    pub teach_id: Uuid,
    pub sequence: i32,
    pub attend_type: AttendTypeOption,
}

#[derive(Serialize, ToSchema)]
pub struct MessageResponse {
    pub message: String,
}

// ── Helpers ──────────────────────────────────────────────────────────────────

fn db_of(depot: &Depot) -> Result<DatabaseConnection, StatusError> {
    depot
        .get_typed::<DatabaseConnection>()
        .map(|d| d.clone())
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))
}

fn parse_id(req: &Request, name: &str) -> Result<Uuid, StatusError> {
    let raw = req
        .param::<String>(name)
        .ok_or_else(|| StatusError::bad_request().brief(format!("Missing parameter {name}")))?;
    Uuid::parse_str(&raw).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))
}

/// Lecturers / staff / administrators may manage a class's meetings; students never.
async fn ensure_can_manage(db: &DatabaseConnection, scope: &DataScope, teach_id: Uuid) -> Result<(), StatusError> {
    if matches!(scope, DataScope::Student(_)) {
        return Err(StatusError::forbidden().brief("Students cannot manage attendance"));
    }
    if scope.is_visible::<teaches::Entity, _>(db, teach_id).await? {
        Ok(())
    } else {
        Err(StatusError::forbidden().brief("Class is outside your data scope"))
    }
}

async fn find_meeting(db: &DatabaseConnection, id: Uuid) -> Result<meet_mod::Model, StatusError> {
    meet_mod::Entity::find_by_id(id)
        .filter(meet_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(internal)?
        .ok_or_else(|| StatusError::not_found().brief("Meeting not found"))
}

/// Students (id, name, code) enrolled in a class.
async fn enrolled_students(db: &DatabaseConnection, teach_id: Uuid) -> Result<Vec<(Uuid, String, String)>, StatusError> {
    let details = detail_activities::Entity::find()
        .filter(detail_activities::Column::TeachId.eq(teach_id))
        .filter(detail_activities::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(internal)?;
    let activity_ids: Vec<Uuid> = details.iter().map(|d| d.activity_id).collect();
    if activity_ids.is_empty() {
        return Ok(vec![]);
    }
    let student_ids: Vec<Uuid> = student_activities::Entity::find()
        .filter(student_activities::Column::Id.is_in(activity_ids))
        .filter(student_activities::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(internal)?
        .into_iter()
        .map(|a| a.student_id)
        .collect();
    let mut list: Vec<(Uuid, String, String)> = students::Entity::find()
        .filter(students::Column::Id.is_in(student_ids))
        .filter(students::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(internal)?
        .into_iter()
        .map(|s| (s.id, s.name, s.code))
        .collect();
    list.sort_by(|a, b| a.2.cmp(&b.2));
    list.dedup_by_key(|s| s.0);
    Ok(list)
}

async fn all_attend_types(db: &DatabaseConnection) -> Result<Vec<attend_types::Model>, StatusError> {
    attend_types::Entity::find()
        .filter(attend_types::Column::DeletedAt.is_null())
        .order_by_asc(attend_types::Column::Code)
        .all(db)
        .await
        .map_err(internal)
}

/// The "present" attendance type, which a QR scan records.
async fn present_attend_type(db: &DatabaseConnection) -> Result<attend_types::Model, StatusError> {
    all_attend_types(db)
        .await?
        .into_iter()
        .find(|t| t.alphabet_code.trim().eq_ignore_ascii_case(PRESENT_ALPHABET_CODE))
        .ok_or_else(|| {
            StatusError::conflict().brief(format!(
                "Attendance type with alphabet code '{PRESENT_ALPHABET_CODE}' (present) is not configured"
            ))
        })
}

fn notify_student(student_id: Uuid, meeting: &meet_mod::Model, attend_type: &AttendTypeOption, method: &str) {
    publish_event(
        &format!("student-attendance:{student_id}"),
        serde_json::json!({
            "type": "attendance_changed",
            "teach_id": meeting.teach_id,
            "meeting_id": meeting.id,
            "sequence": meeting.sequence,
            "meeting_type": meeting.meeting_type,
            "attend_type_id": attend_type.id,
            "attend_type_code": attend_type.alphabet_code,
            "attend_type_name": attend_type.name,
            "method": method,
        }),
    );
}

fn notify_roster(meeting_id: Uuid, student_id: Uuid, attend_type: &AttendTypeOption, method: &str) {
    publish_event(
        &format!("meeting:{meeting_id}"),
        serde_json::json!({
            "type": "attendance_changed",
            "meeting_id": meeting_id,
            "student_id": student_id,
            "attend_type_id": attend_type.id,
            "attend_type_code": attend_type.alphabet_code,
            "attend_type_name": attend_type.name,
            "method": method,
        }),
    );
}

/// Prints the attendance sheet of a class as PDF (`?filled=true` includes recorded attendance).
#[endpoint(tags("Academic - Campaign - Transaction - TeachAttendance"), status_codes(200, 400, 403, 500))]
pub async fn print_attendance(req: &mut Request, depot: &mut Depot, res: &mut Response) -> Result<(), StatusError> {
    let db = db_of(depot)?;
    let scope = DataScope::resolve(&db, depot).await?;
    let teach_id = parse_id(req, "id")?;
    ensure_can_manage(&db, &scope, teach_id).await?;
    let filled = req.query::<bool>("filled").unwrap_or(false);

    let pdf = crate::services::pdf::institution_092010::academic::campaign::transaction::teach_attendences::teach_attendence::generate_pdf(&db, teach_id, filled)
        .await
        .map_err(internal)?;

    res.headers_mut().insert(
        salvo::http::header::CONTENT_TYPE,
        salvo::http::HeaderValue::from_static("application/pdf"),
    );
    res.headers_mut().insert(
        salvo::http::header::CONTENT_DISPOSITION,
        salvo::http::HeaderValue::from_static("attachment; filename=attendance.pdf"),
    );
    res.write_body(pdf).map_err(internal)?;
    Ok(())
}

/// Prints the grade sheet of a class as PDF (`?filled=true` includes recorded marks).
#[endpoint(tags("Academic - Campaign - Transaction - TeachAttendance"), status_codes(200, 400, 403, 500))]
pub async fn print_grade(req: &mut Request, depot: &mut Depot, res: &mut Response) -> Result<(), StatusError> {
    let db = db_of(depot)?;
    let scope = DataScope::resolve(&db, depot).await?;
    let teach_id = parse_id(req, "id")?;
    ensure_can_manage(&db, &scope, teach_id).await?;
    let filled = req.query::<bool>("filled").unwrap_or(false);

    let pdf = crate::services::pdf::institution_092010::academic::campaign::transaction::teach_grade::teach_grade::generate_pdf(&db, teach_id, filled)
        .await
        .map_err(internal)?;

    res.headers_mut().insert(
        salvo::http::header::CONTENT_TYPE,
        salvo::http::HeaderValue::from_static("application/pdf"),
    );
    res.headers_mut().insert(
        salvo::http::header::CONTENT_DISPOSITION,
        salvo::http::HeaderValue::from_static("attachment; filename=grade.pdf"),
    );
    res.write_body(pdf).map_err(internal)?;
    Ok(())
}

/// Downloads the grade sheet of a class as Excel (`?filled=true` includes recorded marks).
#[endpoint(tags("Academic - Campaign - Transaction - TeachAttendance"), status_codes(200, 400, 403, 500))]
pub async fn print_grade_xlsx(req: &mut Request, depot: &mut Depot, res: &mut Response) -> Result<(), StatusError> {
    let db = db_of(depot)?;
    let scope = DataScope::resolve(&db, depot).await?;
    let teach_id = parse_id(req, "id")?;
    ensure_can_manage(&db, &scope, teach_id).await?;
    let filled = req.query::<bool>("filled").unwrap_or(false);

    let xlsx = crate::services::pdf::institution_092010::academic::campaign::transaction::teach_grade::teach_grade::generate_xlsx(&db, teach_id, filled)
        .await
        .map_err(internal)?;

    res.headers_mut().insert(
        salvo::http::header::CONTENT_TYPE,
        salvo::http::HeaderValue::from_static("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
    );
    res.headers_mut().insert(
        salvo::http::header::CONTENT_DISPOSITION,
        salvo::http::HeaderValue::from_static("attachment; filename=grade.xlsx"),
    );
    res.write_body(xlsx).map_err(internal)?;
    Ok(())
}

// ── Meetings ─────────────────────────────────────────────────────────────────

/// Lists the 16 meetings of a class, creating them on first access.
#[endpoint(tags("Academic - Campaign - Transaction - TeachAttendance"), status_codes(200, 400, 403, 500))]
pub async fn meetings_index(req: &mut Request, depot: &mut Depot) -> Result<Json<Vec<MeetingResponse>>, StatusError> {
    let db = db_of(depot)?;
    let scope = DataScope::resolve(&db, depot).await?;
    let teach_id: Uuid = req
        .query::<Uuid>("teach_id")
        .ok_or_else(|| StatusError::bad_request().brief("teach_id is required"))?;
    ensure_can_manage(&db, &scope, teach_id).await?;

    let user = auth_user_id(depot);
    let now = Utc::now().naive_utc();
    let txn = db.begin().await.map_err(internal)?;
    let existing = meet_mod::Entity::find()
        .filter(meet_mod::Column::TeachId.eq(teach_id))
        .filter(meet_mod::Column::DeletedAt.is_null())
        .all(&txn)
        .await
        .map_err(internal)?;
    for sequence in 1..=MEETINGS_PER_TEACH {
        if existing.iter().any(|m| m.sequence == sequence) {
            continue;
        }
        meet_mod::ActiveModel {
            id: Set(Uuid::new_v4()),
            teach_id: Set(teach_id),
            sequence: Set(sequence),
            meeting_type: Set(meeting_type_for(sequence).to_string()),
            created_at: Set(Some(now)),
            updated_at: Set(Some(now)),
            created_by: Set(user),
            updated_by: Set(user),
            ..Default::default()
        }
        .insert(&txn)
        .await
        .map_err(internal)?;
    }
    txn.commit().await.map_err(internal)?;

    let meetings = meet_mod::Entity::find()
        .filter(meet_mod::Column::TeachId.eq(teach_id))
        .filter(meet_mod::Column::DeletedAt.is_null())
        .order_by_asc(meet_mod::Column::Sequence)
        .all(&db)
        .await
        .map_err(internal)?;
    Ok(Json(meetings.into_iter().map(Into::into).collect()))
}

// ── Roster & manual attendance ───────────────────────────────────────────────

#[endpoint(tags("Academic - Campaign - Transaction - TeachAttendance"), status_codes(200, 400, 403, 404, 500))]
pub async fn roster(req: &mut Request, depot: &mut Depot) -> Result<Json<RosterResponse>, StatusError> {
    let db = db_of(depot)?;
    let scope = DataScope::resolve(&db, depot).await?;
    let meeting = find_meeting(&db, parse_id(req, "id")?).await?;
    ensure_can_manage(&db, &scope, meeting.teach_id).await?;

    let records: HashMap<Uuid, att_mod::Model> = att_mod::Entity::find()
        .filter(att_mod::Column::TeachMeetingId.eq(meeting.id))
        .filter(att_mod::Column::DeletedAt.is_null())
        .all(&db)
        .await
        .map_err(internal)?
        .into_iter()
        .map(|a| (a.student_id, a))
        .collect();

    let entries = enrolled_students(&db, meeting.teach_id)
        .await?
        .into_iter()
        .map(|(student_id, student_name, student_code)| {
            let rec = records.get(&student_id);
            RosterEntry {
                student_id,
                student_name,
                student_code,
                attend_type_id: rec.map(|r| r.attend_type_id),
                method: rec.map(|r| r.method.clone()),
                marked_at: rec.and_then(|r| r.marked_at),
            }
        })
        .collect();
    let attend_types = all_attend_types(&db).await?.into_iter().map(Into::into).collect();
    Ok(Json(RosterResponse { attend_types, entries }))
}

/// Lecturer sets attendance statuses; every changed student is notified over WebSocket.
#[endpoint(tags("Academic - Campaign - Transaction - TeachAttendance"), status_codes(200, 400, 403, 404, 500))]
pub async fn save_attendances(req: &mut Request, depot: &mut Depot) -> Result<Json<MessageResponse>, StatusError> {
    let db = db_of(depot)?;
    let scope = DataScope::resolve(&db, depot).await?;
    let meeting = find_meeting(&db, parse_id(req, "id")?).await?;
    ensure_can_manage(&db, &scope, meeting.teach_id).await?;

    let payload: SaveAttendancesRequest = req
        .parse_json()
        .await
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid JSON payload: {e}")))?;
    let types: HashMap<Uuid, AttendTypeOption> =
        all_attend_types(&db).await?.into_iter().map(|t| (t.id, t.into())).collect();
    if let Some(bad) = payload.entries.iter().find(|e| !types.contains_key(&e.attend_type_id)) {
        return Err(StatusError::bad_request().brief(format!("Unknown attendance type '{}'", bad.attend_type_id)));
    }

    let enrolled: Vec<Uuid> = enrolled_students(&db, meeting.teach_id).await?.into_iter().map(|s| s.0).collect();
    if payload.entries.iter().any(|e| !enrolled.contains(&e.student_id)) {
        return Err(StatusError::bad_request().brief("Student is not enrolled in this class"));
    }

    let user = auth_user_id(depot);
    let now = Utc::now().naive_utc();
    let txn = db.begin().await.map_err(internal)?;
    let mut changed: Vec<(Uuid, Uuid)> = vec![];
    for entry in payload.entries {
        let existing = att_mod::Entity::find()
            .filter(att_mod::Column::TeachMeetingId.eq(meeting.id))
            .filter(att_mod::Column::StudentId.eq(entry.student_id))
            .filter(att_mod::Column::DeletedAt.is_null())
            .one(&txn)
            .await
            .map_err(internal)?;
        match existing {
            Some(rec) if rec.attend_type_id == entry.attend_type_id => continue,
            Some(rec) => {
                let mut am: att_mod::ActiveModel = rec.into();
                am.attend_type_id = Set(entry.attend_type_id);
                am.method = Set("manual".to_string());
                am.marked_at = Set(Some(now));
                am.marked_by = Set(user);
                am.updated_at = Set(Some(now));
                am.update(&txn).await.map_err(internal)?;
            }
            None => {
                att_mod::ActiveModel {
                    id: Set(Uuid::new_v4()),
                    teach_meeting_id: Set(meeting.id),
                    student_id: Set(entry.student_id),
                    attend_type_id: Set(entry.attend_type_id),
                    method: Set("manual".to_string()),
                    marked_at: Set(Some(now)),
                    marked_by: Set(user),
                    created_at: Set(Some(now)),
                    updated_at: Set(Some(now)),
                    ..Default::default()
                }
                .insert(&txn)
                .await
                .map_err(internal)?;
            }
        }
        changed.push((entry.student_id, entry.attend_type_id));
    }
    txn.commit().await.map_err(internal)?;

    for (student_id, type_id) in &changed {
        let attend_type = &types[type_id];
        notify_student(*student_id, &meeting, attend_type, "manual");
        notify_roster(meeting.id, *student_id, attend_type, "manual");
    }
    Ok(Json(MessageResponse { message: format!("{} attendance record(s) saved", changed.len()) }))
}

// ── QR attendance ────────────────────────────────────────────────────────────

#[endpoint(tags("Academic - Campaign - Transaction - TeachAttendance"), status_codes(200, 403, 404, 500))]
pub async fn open_qr(req: &mut Request, depot: &mut Depot) -> Result<Json<QrTokenResponse>, StatusError> {
    let db = db_of(depot)?;
    let scope = DataScope::resolve(&db, depot).await?;
    let meeting = find_meeting(&db, parse_id(req, "id")?).await?;
    ensure_can_manage(&db, &scope, meeting.teach_id).await?;

    let payload: OpenQrRequest = req.parse_json().await.unwrap_or_default();
    let minutes = payload.minutes.unwrap_or(QR_DEFAULT_OPEN_MINUTES).clamp(1, 120);
    let until = Utc::now().naive_utc() + Duration::minutes(minutes);

    let mut am: meet_mod::ActiveModel = meeting.into();
    am.qr_open_until = Set(Some(until));
    am.updated_at = Set(Some(Utc::now().naive_utc()));
    let meeting = am.update(&db).await.map_err(internal)?;

    let (token, expires_in) = current_qr_token(meeting.id);
    Ok(Json(QrTokenResponse { token, expires_in }))
}

#[endpoint(tags("Academic - Campaign - Transaction - TeachAttendance"), status_codes(200, 403, 404, 409, 500))]
pub async fn qr_token(req: &mut Request, depot: &mut Depot) -> Result<Json<QrTokenResponse>, StatusError> {
    let db = db_of(depot)?;
    let scope = DataScope::resolve(&db, depot).await?;
    let meeting = find_meeting(&db, parse_id(req, "id")?).await?;
    ensure_can_manage(&db, &scope, meeting.teach_id).await?;
    if !meeting.qr_open_until.is_some_and(|t| t > Utc::now().naive_utc()) {
        return Err(StatusError::conflict().brief("QR attendance is not open"));
    }
    let (token, expires_in) = current_qr_token(meeting.id);
    Ok(Json(QrTokenResponse { token, expires_in }))
}

#[endpoint(tags("Academic - Campaign - Transaction - TeachAttendance"), status_codes(200, 403, 404, 500))]
pub async fn close_qr(req: &mut Request, depot: &mut Depot) -> Result<Json<MessageResponse>, StatusError> {
    let db = db_of(depot)?;
    let scope = DataScope::resolve(&db, depot).await?;
    let meeting = find_meeting(&db, parse_id(req, "id")?).await?;
    ensure_can_manage(&db, &scope, meeting.teach_id).await?;

    let id = meeting.id;
    let mut am: meet_mod::ActiveModel = meeting.into();
    am.qr_open_until = Set(None);
    am.updated_at = Set(Some(Utc::now().naive_utc()));
    am.update(&db).await.map_err(internal)?;
    forget_qr_token(id);
    Ok(Json(MessageResponse { message: "QR attendance closed".to_string() }))
}

/// A student scans the lecturer's QR code; on success the student is marked present.
#[endpoint(tags("Academic - Campaign - Transaction - TeachAttendance"), status_codes(200, 400, 403, 404, 409, 500))]
pub async fn scan(req: &mut Request, depot: &mut Depot) -> Result<Json<ScanResponse>, StatusError> {
    let db = db_of(depot)?;
    let scope = DataScope::resolve(&db, depot).await?;
    let DataScope::Student(student_id) = scope else {
        return Err(StatusError::forbidden().brief("Only students can scan attendance QR codes"));
    };

    let payload: ScanRequest = req
        .parse_json()
        .await
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid JSON payload: {e}")))?;
    let meeting_id = meeting_for_qr_token(payload.token.trim())
        .ok_or_else(|| StatusError::bad_request().brief("QR code is invalid or expired"))?;
    let meeting = find_meeting(&db, meeting_id).await?;
    if !meeting.qr_open_until.is_some_and(|t| t > Utc::now().naive_utc()) {
        return Err(StatusError::conflict().brief("QR attendance is closed"));
    }
    if !enrolled_students(&db, meeting.teach_id).await?.iter().any(|s| s.0 == student_id) {
        return Err(StatusError::forbidden().brief("You are not enrolled in this class"));
    }

    let present = present_attend_type(&db).await?;
    let now = Utc::now().naive_utc();
    let txn = db.begin().await.map_err(internal)?;
    let existing = att_mod::Entity::find()
        .filter(att_mod::Column::TeachMeetingId.eq(meeting.id))
        .filter(att_mod::Column::StudentId.eq(student_id))
        .filter(att_mod::Column::DeletedAt.is_null())
        .one(&txn)
        .await
        .map_err(internal)?;
    match existing {
        Some(rec) => {
            let mut am: att_mod::ActiveModel = rec.into();
            am.attend_type_id = Set(present.id);
            am.method = Set("qr".to_string());
            am.marked_at = Set(Some(now));
            am.marked_by = Set(auth_user_id(depot));
            am.updated_at = Set(Some(now));
            am.update(&txn).await.map_err(internal)?;
        }
        None => {
            att_mod::ActiveModel {
                id: Set(Uuid::new_v4()),
                teach_meeting_id: Set(meeting.id),
                student_id: Set(student_id),
                attend_type_id: Set(present.id),
                method: Set("qr".to_string()),
                marked_at: Set(Some(now)),
                marked_by: Set(auth_user_id(depot)),
                created_at: Set(Some(now)),
                updated_at: Set(Some(now)),
                ..Default::default()
            }
            .insert(&txn)
            .await
            .map_err(internal)?;
        }
    }
    txn.commit().await.map_err(internal)?;

    let present: AttendTypeOption = present.into();
    notify_student(student_id, &meeting, &present, "qr");
    notify_roster(meeting.id, student_id, &present, "qr");

    Ok(Json(ScanResponse {
        meeting_id: meeting.id,
        teach_id: meeting.teach_id,
        sequence: meeting.sequence,
        attend_type: present,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn exam_meetings_are_8_and_16() {
        assert_eq!(meeting_type_for(1), "regular");
        assert_eq!(meeting_type_for(8), "midterm");
        assert_eq!(meeting_type_for(15), "regular");
        assert_eq!(meeting_type_for(16), "final");
    }

    #[test]
    fn qr_token_is_stable_within_ttl_and_unknown_tokens_are_rejected() {
        let meeting = Uuid::new_v4();
        let (a, _) = current_qr_token(meeting);
        let (b, remaining) = current_qr_token(meeting);
        assert_eq!(a, b);
        assert!(remaining >= 1 && remaining <= QR_TOKEN_TTL_SECS);
        assert_eq!(meeting_for_qr_token(&a), Some(meeting));
        assert_eq!(meeting_for_qr_token("nope"), None);
        forget_qr_token(meeting);
        assert_eq!(meeting_for_qr_token(&a), None);
    }
}
