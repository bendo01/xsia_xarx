use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod age_classification;
pub mod blood_type;
pub mod eye_color;
pub mod gender;
pub mod hair_color;
pub mod hair_type;
pub mod identification_type;
pub mod income;
pub mod marital_status;
pub mod occupation;
pub mod profession;
pub mod relative_type;
pub mod religion;

pub fn router() -> Router {
    Router::with_path("reference")
        .push(
            Router::with_path("age-classification")
                .get_named("person.reference.age_classification.index", age_classification::index)
                .post_named("person.reference.age_classification.store", age_classification::store)
                .push(
                    Router::with_path("options")
                        .post_named("person.reference.age_classification.option_select", age_classification::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.reference.age_classification.show", age_classification::show)
                        .put_named("person.reference.age_classification.update", age_classification::update)
                        .delete_named("person.reference.age_classification.delete", age_classification::delete),
                ),
        )
        .push(
            Router::with_path("blood-type")
                .get_named("person.reference.blood_type.index", blood_type::index)
                .post_named("person.reference.blood_type.store", blood_type::store)
                .push(
                    Router::with_path("options")
                        .post_named("person.reference.blood_type.option_select", blood_type::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.reference.blood_type.show", blood_type::show)
                        .put_named("person.reference.blood_type.update", blood_type::update)
                        .delete_named("person.reference.blood_type.delete", blood_type::delete),
                ),
        )
        .push(
            Router::with_path("eye-color")
                .get_named("person.reference.eye_color.index", eye_color::index)
                .post_named("person.reference.eye_color.store", eye_color::store)
                .push(
                    Router::with_path("options")
                        .post_named("person.reference.eye_color.option_select", eye_color::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.reference.eye_color.show", eye_color::show)
                        .put_named("person.reference.eye_color.update", eye_color::update)
                        .delete_named("person.reference.eye_color.delete", eye_color::delete),
                ),
        )
        .push(
            Router::with_path("gender")
                .get_named("person.reference.gender.index", gender::index)
                .post_named("person.reference.gender.store", gender::store)
                .push(
                    Router::with_path("options")
                        .post_named("person.reference.gender.option_select", gender::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.reference.gender.show", gender::show)
                        .put_named("person.reference.gender.update", gender::update)
                        .delete_named("person.reference.gender.delete", gender::delete),
                ),
        )
        .push(
            Router::with_path("hair-color")
                .get_named("person.reference.hair_color.index", hair_color::index)
                .post_named("person.reference.hair_color.store", hair_color::store)
                .push(
                    Router::with_path("options")
                        .post_named("person.reference.hair_color.option_select", hair_color::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.reference.hair_color.show", hair_color::show)
                        .put_named("person.reference.hair_color.update", hair_color::update)
                        .delete_named("person.reference.hair_color.delete", hair_color::delete),
                ),
        )
        .push(
            Router::with_path("hair-type")
                .get_named("person.reference.hair_type.index", hair_type::index)
                .post_named("person.reference.hair_type.store", hair_type::store)
                .push(
                    Router::with_path("options")
                        .post_named("person.reference.hair_type.option_select", hair_type::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.reference.hair_type.show", hair_type::show)
                        .put_named("person.reference.hair_type.update", hair_type::update)
                        .delete_named("person.reference.hair_type.delete", hair_type::delete),
                ),
        )
        .push(
            Router::with_path("identification-type")
                .get_named("person.reference.identification_type.index", identification_type::index)
                .post_named("person.reference.identification_type.store", identification_type::store)
                .push(
                    Router::with_path("options")
                        .post_named("person.reference.identification_type.option_select", identification_type::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.reference.identification_type.show", identification_type::show)
                        .put_named("person.reference.identification_type.update", identification_type::update)
                        .delete_named("person.reference.identification_type.delete", identification_type::delete),
                ),
        )
        .push(
            Router::with_path("income")
                .get_named("person.reference.income.index", income::index)
                .post_named("person.reference.income.store", income::store)
                .push(
                    Router::with_path("options")
                        .post_named("person.reference.income.option_select", income::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.reference.income.show", income::show)
                        .put_named("person.reference.income.update", income::update)
                        .delete_named("person.reference.income.delete", income::delete),
                ),
        )
        .push(
            Router::with_path("marital-status")
                .get_named("person.reference.marital_status.index", marital_status::index)
                .post_named("person.reference.marital_status.store", marital_status::store)
                .push(
                    Router::with_path("options")
                        .post_named("person.reference.marital_status.option_select", marital_status::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.reference.marital_status.show", marital_status::show)
                        .put_named("person.reference.marital_status.update", marital_status::update)
                        .delete_named("person.reference.marital_status.delete", marital_status::delete),
                ),
        )
        .push(
            Router::with_path("occupation")
                .get_named("person.reference.occupation.index", occupation::index)
                .post_named("person.reference.occupation.store", occupation::store)
                .push(
                    Router::with_path("options")
                        .post_named("person.reference.occupation.option_select", occupation::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.reference.occupation.show", occupation::show)
                        .put_named("person.reference.occupation.update", occupation::update)
                        .delete_named("person.reference.occupation.delete", occupation::delete),
                ),
        )
        .push(
            Router::with_path("profession")
                .get_named("person.reference.profession.index", profession::index)
                .post_named("person.reference.profession.store", profession::store)
                .push(
                    Router::with_path("options")
                        .post_named("person.reference.profession.option_select", profession::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.reference.profession.show", profession::show)
                        .put_named("person.reference.profession.update", profession::update)
                        .delete_named("person.reference.profession.delete", profession::delete),
                ),
        )
        .push(
            Router::with_path("relative-type")
                .get_named("person.reference.relative_type.index", relative_type::index)
                .post_named("person.reference.relative_type.store", relative_type::store)
                .push(
                    Router::with_path("options")
                        .post_named("person.reference.relative_type.option_select", relative_type::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.reference.relative_type.show", relative_type::show)
                        .put_named("person.reference.relative_type.update", relative_type::update)
                        .delete_named("person.reference.relative_type.delete", relative_type::delete),
                ),
        )
        .push(
            Router::with_path("religion")
                .get_named("person.reference.religion.index", religion::index)
                .post_named("person.reference.religion.store", religion::store)
                .push(
                    Router::with_path("options")
                        .post_named("person.reference.religion.option_select", religion::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.reference.religion.show", religion::show)
                        .put_named("person.reference.religion.update", religion::update)
                        .delete_named("person.reference.religion.delete", religion::delete),
                ),
        )
}
