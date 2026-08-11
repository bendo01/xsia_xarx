use salvo::prelude::*;

pub mod activities;
pub mod calendar_details;
pub mod calendars;
pub mod class_codes;
pub mod grades;
pub mod schedules;
pub mod teach_decrees;
pub mod teach_evaluations;
pub mod teach_lecturers;
pub mod teaches;

pub fn router() -> Router {
    Router::with_path("transaction")
        .push(
            Router::with_path("activities")
                .get(activities::list_activities)
                .post(activities::create_activitie)
                .push(
                    Router::with_path("{id}")
                        .get(activities::get_activitie)
                        .put(activities::update_activitie)
                        .delete(activities::delete_activitie),
                ),
        )
        .push(
            Router::with_path("calendar-details")
                .get(calendar_details::list_calendar_details)
                .post(calendar_details::create_calendar_detail)
                .push(
                    Router::with_path("{id}")
                        .get(calendar_details::get_calendar_detail)
                        .put(calendar_details::update_calendar_detail)
                        .delete(calendar_details::delete_calendar_detail),
                ),
        )
        .push(
            Router::with_path("calendars")
                .get(calendars::list_calendars)
                .post(calendars::create_calendar)
                .push(
                    Router::with_path("{id}")
                        .get(calendars::get_calendar)
                        .put(calendars::update_calendar)
                        .delete(calendars::delete_calendar),
                ),
        )
        .push(
            Router::with_path("class-codes")
                .get(class_codes::list_class_codes)
                .post(class_codes::create_class_code)
                .push(
                    Router::with_path("{id}")
                        .get(class_codes::get_class_code)
                        .put(class_codes::update_class_code)
                        .delete(class_codes::delete_class_code),
                ),
        )
        .push(
            Router::with_path("grades")
                .get(grades::list_grades)
                .post(grades::create_grade)
                .push(
                    Router::with_path("{id}")
                        .get(grades::get_grade)
                        .put(grades::update_grade)
                        .delete(grades::delete_grade),
                ),
        )
        .push(
            Router::with_path("schedules")
                .get(schedules::list_schedules)
                .post(schedules::create_schedule)
                .push(
                    Router::with_path("{id}")
                        .get(schedules::get_schedule)
                        .put(schedules::update_schedule)
                        .delete(schedules::delete_schedule),
                ),
        )
        .push(
            Router::with_path("teach-decrees")
                .get(teach_decrees::list_teach_decrees)
                .post(teach_decrees::create_teach_decree)
                .push(
                    Router::with_path("{id}")
                        .get(teach_decrees::get_teach_decree)
                        .put(teach_decrees::update_teach_decree)
                        .delete(teach_decrees::delete_teach_decree),
                ),
        )
        .push(
            Router::with_path("teach-evaluations")
                .get(teach_evaluations::list_teach_evaluations)
                .post(teach_evaluations::create_teach_evaluation)
                .push(
                    Router::with_path("{id}")
                        .get(teach_evaluations::get_teach_evaluation)
                        .put(teach_evaluations::update_teach_evaluation)
                        .delete(teach_evaluations::delete_teach_evaluation),
                ),
        )
        .push(
            Router::with_path("teach-lecturers")
                .get(teach_lecturers::list_teach_lecturers)
                .post(teach_lecturers::create_teach_lecturer)
                .push(
                    Router::with_path("{id}")
                        .get(teach_lecturers::get_teach_lecturer)
                        .put(teach_lecturers::update_teach_lecturer)
                        .delete(teach_lecturers::delete_teach_lecturer),
                ),
        )
        .push(
            Router::with_path("teaches")
                .get(teaches::list_teaches)
                .post(teaches::create_teache)
                .push(
                    Router::with_path("{id}")
                        .get(teaches::get_teache)
                        .put(teaches::update_teache)
                        .delete(teaches::delete_teache),
                ),
        )
}
