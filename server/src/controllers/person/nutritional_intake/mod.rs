use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod food_group;
pub mod source;
pub mod nutrient;
pub mod food;
pub mod analysis_method;
pub mod food_nutrient;
pub mod local_dish;
pub mod code_history;
pub mod correction;
pub mod intake_log;
pub mod intake_log_item;

pub fn router() -> Router {
    Router::with_path("nutritional-intake")
        .push(
            Router::with_path("food-group")
                .get_named("person.nutritional_intake.food_group.index", food_group::index)
                .post_named("person.nutritional_intake.food_group.store", food_group::store)
                .push(
                    Router::with_path("options")
                        .post_named("person.nutritional_intake.food_group.option_select", food_group::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.nutritional_intake.food_group.show", food_group::show)
                        .put_named("person.nutritional_intake.food_group.update", food_group::update)
                        .delete_named("person.nutritional_intake.food_group.delete", food_group::delete),
                ),
        )
        .push(
            Router::with_path("source")
                .get_named("person.nutritional_intake.source.index", source::index)
                .post_named("person.nutritional_intake.source.store", source::store)
                .push(
                    Router::with_path("options")
                        .post_named("person.nutritional_intake.source.option_select", source::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.nutritional_intake.source.show", source::show)
                        .put_named("person.nutritional_intake.source.update", source::update)
                        .delete_named("person.nutritional_intake.source.delete", source::delete),
                ),
        )
        .push(
            Router::with_path("nutrient")
                .get_named("person.nutritional_intake.nutrient.index", nutrient::index)
                .post_named("person.nutritional_intake.nutrient.store", nutrient::store)
                .push(
                    Router::with_path("options")
                        .post_named("person.nutritional_intake.nutrient.option_select", nutrient::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.nutritional_intake.nutrient.show", nutrient::show)
                        .put_named("person.nutritional_intake.nutrient.update", nutrient::update)
                        .delete_named("person.nutritional_intake.nutrient.delete", nutrient::delete),
                ),
        )
        .push(
            Router::with_path("food")
                .get_named("person.nutritional_intake.food.index", food::index)
                .post_named("person.nutritional_intake.food.store", food::store)
                .push(
                    Router::with_path("options")
                        .post_named("person.nutritional_intake.food.option_select", food::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.nutritional_intake.food.show", food::show)
                        .put_named("person.nutritional_intake.food.update", food::update)
                        .delete_named("person.nutritional_intake.food.delete", food::delete),
                ),
        )
        .push(
            Router::with_path("analysis-method")
                .get_named("person.nutritional_intake.analysis_method.index", analysis_method::index)
                .post_named("person.nutritional_intake.analysis_method.store", analysis_method::store)
                .push(
                    Router::with_path("options")
                        .post_named("person.nutritional_intake.analysis_method.option_select", analysis_method::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.nutritional_intake.analysis_method.show", analysis_method::show)
                        .put_named("person.nutritional_intake.analysis_method.update", analysis_method::update)
                        .delete_named("person.nutritional_intake.analysis_method.delete", analysis_method::delete),
                ),
        )
        .push(
            Router::with_path("food-nutrient")
                .get_named("person.nutritional_intake.food_nutrient.index", food_nutrient::index)
                .post_named("person.nutritional_intake.food_nutrient.store", food_nutrient::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("person.nutritional_intake.food_nutrient.show", food_nutrient::show)
                        .put_named("person.nutritional_intake.food_nutrient.update", food_nutrient::update)
                        .delete_named("person.nutritional_intake.food_nutrient.delete", food_nutrient::delete),
                ),
        )
        .push(
            Router::with_path("local-dish")
                .get_named("person.nutritional_intake.local_dish.index", local_dish::index)
                .post_named("person.nutritional_intake.local_dish.store", local_dish::store)
                .push(
                    Router::with_path("options")
                        .post_named("person.nutritional_intake.local_dish.option_select", local_dish::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.nutritional_intake.local_dish.show", local_dish::show)
                        .put_named("person.nutritional_intake.local_dish.update", local_dish::update)
                        .delete_named("person.nutritional_intake.local_dish.delete", local_dish::delete),
                ),
        )
        .push(
            Router::with_path("code-history")
                .get_named("person.nutritional_intake.code_history.index", code_history::index)
                .post_named("person.nutritional_intake.code_history.store", code_history::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("person.nutritional_intake.code_history.show", code_history::show)
                        .put_named("person.nutritional_intake.code_history.update", code_history::update)
                        .delete_named("person.nutritional_intake.code_history.delete", code_history::delete),
                ),
        )
        .push(
            Router::with_path("correction")
                .get_named("person.nutritional_intake.correction.index", correction::index)
                .post_named("person.nutritional_intake.correction.store", correction::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("person.nutritional_intake.correction.show", correction::show)
                        .put_named("person.nutritional_intake.correction.update", correction::update)
                        .delete_named("person.nutritional_intake.correction.delete", correction::delete),
                ),
        )
        .push(
            Router::with_path("intake-log")
                .get_named("person.nutritional_intake.intake_log.index", intake_log::index)
                .post_named("person.nutritional_intake.intake_log.store", intake_log::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("person.nutritional_intake.intake_log.show", intake_log::show)
                        .put_named("person.nutritional_intake.intake_log.update", intake_log::update)
                        .delete_named("person.nutritional_intake.intake_log.delete", intake_log::delete),
                ),
        )
        .push(
            Router::with_path("intake-log-item")
                .get_named("person.nutritional_intake.intake_log_item.index", intake_log_item::index)
                .post_named("person.nutritional_intake.intake_log_item.store", intake_log_item::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("person.nutritional_intake.intake_log_item.show", intake_log_item::show)
                        .put_named("person.nutritional_intake.intake_log_item.update", intake_log_item::update)
                        .delete_named("person.nutritional_intake.intake_log_item.delete", intake_log_item::delete),
                ),
        )
}
