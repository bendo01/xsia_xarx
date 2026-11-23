use salvo::oapi::ToSchema;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// A question to the student-data assistant
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct AssistantAskRequest {
    /// The question. Lecturers and staff name the student by student number (NIM) or full name; a student always gets their own data
    pub question: String,
    /// Sections to read instead of letting the server guess from the question: `profile`, `academic`, `finance`,
    /// `sensitive`. What the caller may see is still decided per student
    pub sections: Option<Vec<String>>,
    /// The student to continue about, e.g. the `student_id` of the previous answer, when the question names no NIM.
    /// It is checked like any other request, and ignored for a student
    pub student_id: Option<Uuid>,
    /// Language model: `qwen` (default), `qwen3`, `gemma` or `gemma1b`
    pub model: Option<String>,
    /// 0 to 1, default 0 (the answer repeats data, so it is deterministic)
    pub temperature: Option<f64>,
    /// 16 to 1024, default 400
    pub max_new_tokens: Option<usize>,
    /// Continue a conversation; a new one is created when missing
    pub conversation_id: Option<Uuid>,
}
