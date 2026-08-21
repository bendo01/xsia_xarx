use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

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
                .get_named("academic.campaign.transaction.activities.list_activities", activities::list_activities)
                .post_named("academic.campaign.transaction.activities.create_activitie", activities::create_activitie)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.transaction.activities.get_activitie", activities::get_activitie)
                        .put_named("academic.campaign.transaction.activities.update_activitie", activities::update_activitie)
                        .delete_named("academic.campaign.transaction.activities.delete_activitie", activities::delete_activitie),
                ),
        )
        .push(
            Router::with_path("calendar-details")
                .get_named("academic.campaign.transaction.calendar_details.list_calendar_details", calendar_details::list_calendar_details)
                .post_named("academic.campaign.transaction.calendar_details.create_calendar_detail", calendar_details::create_calendar_detail)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.transaction.calendar_details.get_calendar_detail", calendar_details::get_calendar_detail)
                        .put_named("academic.campaign.transaction.calendar_details.update_calendar_detail", calendar_details::update_calendar_detail)
                        .delete_named("academic.campaign.transaction.calendar_details.delete_calendar_detail", calendar_details::delete_calendar_detail),
                ),
        )
        .push(
            Router::with_path("calendars")
                .get_named("academic.campaign.transaction.calendars.list_calendars", calendars::list_calendars)
                .post_named("academic.campaign.transaction.calendars.create_calendar", calendars::create_calendar)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.transaction.calendars.get_calendar", calendars::get_calendar)
                        .put_named("academic.campaign.transaction.calendars.update_calendar", calendars::update_calendar)
                        .delete_named("academic.campaign.transaction.calendars.delete_calendar", calendars::delete_calendar),
                ),
        )
        .push(
            Router::with_path("class-codes")
                .get_named("academic.campaign.transaction.class_codes.list_class_codes", class_codes::list_class_codes)
                .post_named("academic.campaign.transaction.class_codes.create_class_code", class_codes::create_class_code)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.transaction.class_codes.get_class_code", class_codes::get_class_code)
                        .put_named("academic.campaign.transaction.class_codes.update_class_code", class_codes::update_class_code)
                        .delete_named("academic.campaign.transaction.class_codes.delete_class_code", class_codes::delete_class_code),
                ),
        )
        .push(
            Router::with_path("grades")
                .get_named("academic.campaign.transaction.grades.list_grades", grades::list_grades)
                .post_named("academic.campaign.transaction.grades.create_grade", grades::create_grade)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.transaction.grades.get_grade", grades::get_grade)
                        .put_named("academic.campaign.transaction.grades.update_grade", grades::update_grade)
                        .delete_named("academic.campaign.transaction.grades.delete_grade", grades::delete_grade),
                ),
        )
        .push(
            Router::with_path("schedules")
                .get_named("academic.campaign.transaction.schedules.list_schedules", schedules::list_schedules)
                .post_named("academic.campaign.transaction.schedules.create_schedule", schedules::create_schedule)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.transaction.schedules.get_schedule", schedules::get_schedule)
                        .put_named("academic.campaign.transaction.schedules.update_schedule", schedules::update_schedule)
                        .delete_named("academic.campaign.transaction.schedules.delete_schedule", schedules::delete_schedule),
                ),
        )
        .push(
            Router::with_path("teach-decrees")
                .get_named("academic.campaign.transaction.teach_decrees.list_teach_decrees", teach_decrees::list_teach_decrees)
                .post_named("academic.campaign.transaction.teach_decrees.create_teach_decree", teach_decrees::create_teach_decree)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.transaction.teach_decrees.get_teach_decree", teach_decrees::get_teach_decree)
                        .put_named("academic.campaign.transaction.teach_decrees.update_teach_decree", teach_decrees::update_teach_decree)
                        .delete_named("academic.campaign.transaction.teach_decrees.delete_teach_decree", teach_decrees::delete_teach_decree),
                ),
        )
        .push(
            Router::with_path("teach-evaluations")
                .get_named("academic.campaign.transaction.teach_evaluations.list_teach_evaluations", teach_evaluations::list_teach_evaluations)
                .post_named("academic.campaign.transaction.teach_evaluations.create_teach_evaluation", teach_evaluations::create_teach_evaluation)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.transaction.teach_evaluations.get_teach_evaluation", teach_evaluations::get_teach_evaluation)
                        .put_named("academic.campaign.transaction.teach_evaluations.update_teach_evaluation", teach_evaluations::update_teach_evaluation)
                        .delete_named("academic.campaign.transaction.teach_evaluations.delete_teach_evaluation", teach_evaluations::delete_teach_evaluation),
                ),
        )
        .push(
            Router::with_path("teach-lecturers")
                .get_named("academic.campaign.transaction.teach_lecturers.list_teach_lecturers", teach_lecturers::list_teach_lecturers)
                .post_named("academic.campaign.transaction.teach_lecturers.create_teach_lecturer", teach_lecturers::create_teach_lecturer)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.transaction.teach_lecturers.get_teach_lecturer", teach_lecturers::get_teach_lecturer)
                        .put_named("academic.campaign.transaction.teach_lecturers.update_teach_lecturer", teach_lecturers::update_teach_lecturer)
                        .delete_named("academic.campaign.transaction.teach_lecturers.delete_teach_lecturer", teach_lecturers::delete_teach_lecturer),
                ),
        )
        .push(
            Router::with_path("teaches")
                .get_named("academic.campaign.transaction.teaches.list_teaches", teaches::list_teaches)
                .post_named("academic.campaign.transaction.teaches.create_teache", teaches::create_teache)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.transaction.teaches.get_teache", teaches::get_teache)
                        .put_named("academic.campaign.transaction.teaches.update_teache", teaches::update_teache)
                        .delete_named("academic.campaign.transaction.teaches.delete_teache", teaches::delete_teache),
                ),
        )
}
