use salvo::prelude::*;
pub mod campaign;
pub mod candidate;
pub mod course;
pub mod general;
pub mod lecturer;
pub mod prior_learning_recognition;
pub mod student;
pub mod survey;

pub fn router() -> Router {
    Router::with_path("academic")
        .push(campaign::router())
        .push(candidate::router())
        .push(course::router())
        .push(general::router())
        .push(lecturer::router())
        .push(prior_learning_recognition::router())
        .push(student::router())
        .push(survey::router())
}
