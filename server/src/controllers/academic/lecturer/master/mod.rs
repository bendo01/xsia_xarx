use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod lecturers;

pub fn router() -> Router {
    Router::with_path("master")
        .push(
            Router::with_path("lecturers")
                .get_named("academic.lecturer.master.lecturers.index", lecturers::index)
                .post_named("academic.lecturer.master.lecturers.store", lecturers::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.lecturer.master.lecturers.option_select", lecturers::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.lecturer.master.lecturers.show", lecturers::show)
                        .put_named("academic.lecturer.master.lecturers.update", lecturers::update)
                        .delete_named("academic.lecturer.master.lecturers.delete", lecturers::delete)
                        .push(
                            Router::with_path("chart")
                                .get_named("academic.lecturer.master.lecturers.get_teach_credit_chart", lecturers::get_teach_credit_chart),
                        )
                        .push(
                            Router::with_path("teach-credit-chart")
                                .get_named("academic.lecturer.master.lecturers.get_teach_credit_chart_kebab", lecturers::get_teach_credit_chart),
                        )
                        .push(
                            Router::with_path("teach-lecture-chart")
                                .get_named("academic.lecturer.master.lecturers.get_teach_lecture_chart", lecturers::get_teach_lecture_chart),
                        )
                        .push(
                            Router::with_path("yearly-credit-trends")
                                .get_named("academic.lecturer.master.lecturers.get_yearly_credit_trends", lecturers::get_yearly_credit_trends),
                        ),
                ),
        )
}
