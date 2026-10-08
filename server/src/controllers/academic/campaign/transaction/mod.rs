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
                .get_named("academic.campaign.transaction.activities.list_activities", activities::index)
                .post_named("academic.campaign.transaction.activities.create_activitie", activities::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.transaction.activities.get_activitie", activities::show)
                        .put_named("academic.campaign.transaction.activities.update_activitie", activities::update)
                        .delete_named("academic.campaign.transaction.activities.delete_activitie", activities::delete),
                ),
        )
        .push(
            Router::with_path("calendar-details")
                .get_named("academic.campaign.transaction.calendar_details.list_calendar_details", calendar_details::index)
                .post_named("academic.campaign.transaction.calendar_details.create_calendar_detail", calendar_details::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.transaction.calendar_details.options_calendar_details", calendar_details::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.transaction.calendar_details.get_calendar_detail", calendar_details::show)
                        .put_named("academic.campaign.transaction.calendar_details.update_calendar_detail", calendar_details::update)
                        .delete_named("academic.campaign.transaction.calendar_details.delete_calendar_detail", calendar_details::delete),
                ),
        )
        .push(
            Router::with_path("calendars")
                .get_named("academic.campaign.transaction.calendars.list_calendars", calendars::index)
                .post_named("academic.campaign.transaction.calendars.create_calendar", calendars::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.transaction.calendars.options_calendars", calendars::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.transaction.calendars.get_calendar", calendars::show)
                        .put_named("academic.campaign.transaction.calendars.update_calendar", calendars::update)
                        .delete_named("academic.campaign.transaction.calendars.delete_calendar", calendars::delete),
                ),
        )
        .push(
            Router::with_path("class-codes")
                .get_named("academic.campaign.transaction.class_codes.list_class_codes", class_codes::index)
                .post_named("academic.campaign.transaction.class_codes.create_class_code", class_codes::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.transaction.class_codes.options_class_codes", class_codes::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.transaction.class_codes.get_class_code", class_codes::show)
                        .put_named("academic.campaign.transaction.class_codes.update_class_code", class_codes::update)
                        .delete_named("academic.campaign.transaction.class_codes.delete_class_code", class_codes::delete),
                ),
        )
        .push(
            Router::with_path("grades")
                .get_named("academic.campaign.transaction.grades.list_grades", grades::index)
                .post_named("academic.campaign.transaction.grades.create_grade", grades::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.transaction.grades.options_grades", grades::option_select),
                )
                .push(
                    Router::with_path("unit/{unit_id}")
                        .get_named("academic.campaign.transaction.grades.get_grades_by_unit", grades::get_grades_by_unit),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.transaction.grades.get_grade", grades::show)
                        .put_named("academic.campaign.transaction.grades.update_grade", grades::update)
                        .delete_named("academic.campaign.transaction.grades.delete_grade", grades::delete),
                ),
        )
        .push(
            Router::with_path("schedules")
                .get_named("academic.campaign.transaction.schedules.list_schedules", schedules::index)
                .post_named("academic.campaign.transaction.schedules.create_schedule", schedules::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.transaction.schedules.options_schedules", schedules::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.transaction.schedules.get_schedule", schedules::show)
                        .put_named("academic.campaign.transaction.schedules.update_schedule", schedules::update)
                        .delete_named("academic.campaign.transaction.schedules.delete_schedule", schedules::delete),
                ),
        )
        .push(
            Router::with_path("teach-decrees")
                .get_named("academic.campaign.transaction.teach_decrees.list_teach_decrees", teach_decrees::index)
                .post_named("academic.campaign.transaction.teach_decrees.create_teach_decree", teach_decrees::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.transaction.teach_decrees.options_teach_decrees", teach_decrees::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.transaction.teach_decrees.get_teach_decree", teach_decrees::show)
                        .put_named("academic.campaign.transaction.teach_decrees.update_teach_decree", teach_decrees::update)
                        .delete_named("academic.campaign.transaction.teach_decrees.delete_teach_decree", teach_decrees::delete),
                ),
        )
        .push(
            Router::with_path("teach-evaluations")
                .get_named("academic.campaign.transaction.teach_evaluations.list_teach_evaluations", teach_evaluations::index)
                .post_named("academic.campaign.transaction.teach_evaluations.create_teach_evaluation", teach_evaluations::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.transaction.teach_evaluations.options_teach_evaluations", teach_evaluations::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.transaction.teach_evaluations.get_teach_evaluation", teach_evaluations::show)
                        .put_named("academic.campaign.transaction.teach_evaluations.update_teach_evaluation", teach_evaluations::update)
                        .delete_named("academic.campaign.transaction.teach_evaluations.delete_teach_evaluation", teach_evaluations::delete),
                ),
        )
        .push(
            Router::with_path("teach-lecturers")
                .get_named("academic.campaign.transaction.teach_lecturers.list_teach_lecturers", teach_lecturers::index)
                .post_named("academic.campaign.transaction.teach_lecturers.create_teach_lecturer", teach_lecturers::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.transaction.teach_lecturers.options_teach_lecturers", teach_lecturers::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.transaction.teach_lecturers.get_teach_lecturer", teach_lecturers::show)
                        .put_named("academic.campaign.transaction.teach_lecturers.update_teach_lecturer", teach_lecturers::update)
                        .delete_named("academic.campaign.transaction.teach_lecturers.delete_teach_lecturer", teach_lecturers::delete),
                ),
        )
        .push(
            Router::with_path("teaches")
                .get_named("academic.campaign.transaction.teaches.list_teaches", teaches::index)
                .post_named("academic.campaign.transaction.teaches.create_teache", teaches::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.transaction.teaches.options_teaches", teaches::option_select),
                )
                .push(
                    Router::with_path("lecturer/{id}")
                        .get_named("academic.campaign.transaction.teaches.get_teaches_by_lecturer", teaches::get_teaches_by_lecturer),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.transaction.teaches.get_teache", teaches::show)
                        .put_named("academic.campaign.transaction.teaches.update_teache", teaches::update)
                        .delete_named("academic.campaign.transaction.teaches.delete_teache", teaches::delete),
                ),
        )
}
