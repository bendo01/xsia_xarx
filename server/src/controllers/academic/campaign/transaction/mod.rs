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
                .get_named("academic.campaign.transaction.activities.index", activities::index)
                .post_named("academic.campaign.transaction.activities.store", activities::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.transaction.activities.show", activities::show)
                        .put_named("academic.campaign.transaction.activities.update", activities::update)
                        .delete_named("academic.campaign.transaction.activities.delete", activities::delete),
                ),
        )
        .push(
            Router::with_path("calendar-details")
                .get_named("academic.campaign.transaction.calendar_details.index", calendar_details::index)
                .post_named("academic.campaign.transaction.calendar_details.store", calendar_details::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.transaction.calendar_details.option_select", calendar_details::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.transaction.calendar_details.show", calendar_details::show)
                        .put_named("academic.campaign.transaction.calendar_details.update", calendar_details::update)
                        .delete_named("academic.campaign.transaction.calendar_details.delete", calendar_details::delete),
                ),
        )
        .push(
            Router::with_path("calendars")
                .get_named("academic.campaign.transaction.calendars.index", calendars::index)
                .post_named("academic.campaign.transaction.calendars.store", calendars::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.transaction.calendars.option_select", calendars::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.transaction.calendars.show", calendars::show)
                        .put_named("academic.campaign.transaction.calendars.update", calendars::update)
                        .delete_named("academic.campaign.transaction.calendars.delete", calendars::delete),
                ),
        )
        .push(
            Router::with_path("class-codes")
                .get_named("academic.campaign.transaction.class_codes.index", class_codes::index)
                .post_named("academic.campaign.transaction.class_codes.store", class_codes::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.transaction.class_codes.option_select", class_codes::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.transaction.class_codes.show", class_codes::show)
                        .put_named("academic.campaign.transaction.class_codes.update", class_codes::update)
                        .delete_named("academic.campaign.transaction.class_codes.delete", class_codes::delete),
                ),
        )
        .push(
            Router::with_path("grades")
                .get_named("academic.campaign.transaction.grades.index", grades::index)
                .post_named("academic.campaign.transaction.grades.store", grades::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.transaction.grades.option_select", grades::option_select),
                )
                .push(
                    Router::with_path("unit/{unit_id}")
                        .get_named("academic.campaign.transaction.grades.get_grades_by_unit", grades::get_grades_by_unit),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.transaction.grades.show", grades::show)
                        .put_named("academic.campaign.transaction.grades.update", grades::update)
                        .delete_named("academic.campaign.transaction.grades.delete", grades::delete),
                ),
        )
        .push(
            Router::with_path("schedules")
                .get_named("academic.campaign.transaction.schedules.index", schedules::index)
                .post_named("academic.campaign.transaction.schedules.store", schedules::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.transaction.schedules.option_select", schedules::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.transaction.schedules.show", schedules::show)
                        .put_named("academic.campaign.transaction.schedules.update", schedules::update)
                        .delete_named("academic.campaign.transaction.schedules.delete", schedules::delete),
                ),
        )
        .push(
            Router::with_path("teach-decrees")
                .get_named("academic.campaign.transaction.teach_decrees.index", teach_decrees::index)
                .post_named("academic.campaign.transaction.teach_decrees.store", teach_decrees::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.transaction.teach_decrees.option_select", teach_decrees::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.transaction.teach_decrees.show", teach_decrees::show)
                        .put_named("academic.campaign.transaction.teach_decrees.update", teach_decrees::update)
                        .delete_named("academic.campaign.transaction.teach_decrees.delete", teach_decrees::delete),
                ),
        )
        .push(
            Router::with_path("teach-evaluations")
                .get_named("academic.campaign.transaction.teach_evaluations.index", teach_evaluations::index)
                .post_named("academic.campaign.transaction.teach_evaluations.store", teach_evaluations::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.transaction.teach_evaluations.option_select", teach_evaluations::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.transaction.teach_evaluations.show", teach_evaluations::show)
                        .put_named("academic.campaign.transaction.teach_evaluations.update", teach_evaluations::update)
                        .delete_named("academic.campaign.transaction.teach_evaluations.delete", teach_evaluations::delete),
                ),
        )
        .push(
            Router::with_path("teach-lecturers")
                .get_named("academic.campaign.transaction.teach_lecturers.index", teach_lecturers::index)
                .post_named("academic.campaign.transaction.teach_lecturers.store", teach_lecturers::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.transaction.teach_lecturers.option_select", teach_lecturers::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.transaction.teach_lecturers.show", teach_lecturers::show)
                        .put_named("academic.campaign.transaction.teach_lecturers.update", teach_lecturers::update)
                        .delete_named("academic.campaign.transaction.teach_lecturers.delete", teach_lecturers::delete),
                ),
        )
        .push(
            Router::with_path("teaches")
                .get_named("academic.campaign.transaction.teaches.index", teaches::index)
                .post_named("academic.campaign.transaction.teaches.store", teaches::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.campaign.transaction.teaches.option_select", teaches::option_select),
                )
                .push(
                    Router::with_path("lecturer/{id}")
                        .get_named("academic.campaign.transaction.teaches.get_teaches_by_lecturer", teaches::get_teaches_by_lecturer),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.campaign.transaction.teaches.show", teaches::show)
                        .put_named("academic.campaign.transaction.teaches.update", teaches::update)
                        .delete_named("academic.campaign.transaction.teaches.delete", teaches::delete),
                ),
        )
}
