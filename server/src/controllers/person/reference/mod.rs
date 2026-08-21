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
                .get_named("person.reference.age_classification.list_age_classification", age_classification::list_age_classification)
                .post_named("person.reference.age_classification.create_age_classification", age_classification::create_age_classification)
                .push(
                    Router::with_path("options")
                        .post_named("person.reference.age_classification.options_age_classification", age_classification::options_age_classification),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.reference.age_classification.get_age_classification", age_classification::get_age_classification)
                        .put_named("person.reference.age_classification.update_age_classification", age_classification::update_age_classification)
                        .delete_named("person.reference.age_classification.delete_age_classification", age_classification::delete_age_classification),
                ),
        )
        .push(
            Router::with_path("blood-type")
                .get_named("person.reference.blood_type.list_blood_type", blood_type::list_blood_type)
                .post_named("person.reference.blood_type.create_blood_type", blood_type::create_blood_type)
                .push(
                    Router::with_path("options")
                        .post_named("person.reference.blood_type.options_blood_type", blood_type::options_blood_type),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.reference.blood_type.get_blood_type", blood_type::get_blood_type)
                        .put_named("person.reference.blood_type.update_blood_type", blood_type::update_blood_type)
                        .delete_named("person.reference.blood_type.delete_blood_type", blood_type::delete_blood_type),
                ),
        )
        .push(
            Router::with_path("eye-color")
                .get_named("person.reference.eye_color.list_eye_color", eye_color::list_eye_color)
                .post_named("person.reference.eye_color.create_eye_color", eye_color::create_eye_color)
                .push(
                    Router::with_path("options")
                        .post_named("person.reference.eye_color.options_eye_color", eye_color::options_eye_color),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.reference.eye_color.get_eye_color", eye_color::get_eye_color)
                        .put_named("person.reference.eye_color.update_eye_color", eye_color::update_eye_color)
                        .delete_named("person.reference.eye_color.delete_eye_color", eye_color::delete_eye_color),
                ),
        )
        .push(
            Router::with_path("gender")
                .get_named("person.reference.gender.list_gender", gender::list_gender)
                .post_named("person.reference.gender.create_gender", gender::create_gender)
                .push(
                    Router::with_path("options")
                        .post_named("person.reference.gender.options_gender", gender::options_gender),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.reference.gender.get_gender", gender::get_gender)
                        .put_named("person.reference.gender.update_gender", gender::update_gender)
                        .delete_named("person.reference.gender.delete_gender", gender::delete_gender),
                ),
        )
        .push(
            Router::with_path("hair-color")
                .get_named("person.reference.hair_color.list_hair_color", hair_color::list_hair_color)
                .post_named("person.reference.hair_color.create_hair_color", hair_color::create_hair_color)
                .push(
                    Router::with_path("options")
                        .post_named("person.reference.hair_color.options_hair_color", hair_color::options_hair_color),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.reference.hair_color.get_hair_color", hair_color::get_hair_color)
                        .put_named("person.reference.hair_color.update_hair_color", hair_color::update_hair_color)
                        .delete_named("person.reference.hair_color.delete_hair_color", hair_color::delete_hair_color),
                ),
        )
        .push(
            Router::with_path("hair-type")
                .get_named("person.reference.hair_type.list_hair_type", hair_type::list_hair_type)
                .post_named("person.reference.hair_type.create_hair_type", hair_type::create_hair_type)
                .push(
                    Router::with_path("options")
                        .post_named("person.reference.hair_type.options_hair_type", hair_type::options_hair_type),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.reference.hair_type.get_hair_type", hair_type::get_hair_type)
                        .put_named("person.reference.hair_type.update_hair_type", hair_type::update_hair_type)
                        .delete_named("person.reference.hair_type.delete_hair_type", hair_type::delete_hair_type),
                ),
        )
        .push(
            Router::with_path("identification-type")
                .get_named("person.reference.identification_type.list_identification_type", identification_type::list_identification_type)
                .post_named("person.reference.identification_type.create_identification_type", identification_type::create_identification_type)
                .push(
                    Router::with_path("options")
                        .post_named("person.reference.identification_type.options_identification_type", identification_type::options_identification_type),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.reference.identification_type.get_identification_type", identification_type::get_identification_type)
                        .put_named("person.reference.identification_type.update_identification_type", identification_type::update_identification_type)
                        .delete_named("person.reference.identification_type.delete_identification_type", identification_type::delete_identification_type),
                ),
        )
        .push(
            Router::with_path("income")
                .get_named("person.reference.income.list_income", income::list_income)
                .post_named("person.reference.income.create_income", income::create_income)
                .push(
                    Router::with_path("options")
                        .post_named("person.reference.income.options_income", income::options_income),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.reference.income.get_income", income::get_income)
                        .put_named("person.reference.income.update_income", income::update_income)
                        .delete_named("person.reference.income.delete_income", income::delete_income),
                ),
        )
        .push(
            Router::with_path("marital-status")
                .get_named("person.reference.marital_status.list_marital_status", marital_status::list_marital_status)
                .post_named("person.reference.marital_status.create_marital_statu", marital_status::create_marital_statu)
                .push(
                    Router::with_path("options")
                        .post_named("person.reference.marital_status.options_marital_status", marital_status::options_marital_status),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.reference.marital_status.get_marital_statu", marital_status::get_marital_statu)
                        .put_named("person.reference.marital_status.update_marital_statu", marital_status::update_marital_statu)
                        .delete_named("person.reference.marital_status.delete_marital_statu", marital_status::delete_marital_statu),
                ),
        )
        .push(
            Router::with_path("occupation")
                .get_named("person.reference.occupation.list_occupation", occupation::list_occupation)
                .post_named("person.reference.occupation.create_occupation", occupation::create_occupation)
                .push(
                    Router::with_path("options")
                        .post_named("person.reference.occupation.options_occupation", occupation::options_occupation),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.reference.occupation.get_occupation", occupation::get_occupation)
                        .put_named("person.reference.occupation.update_occupation", occupation::update_occupation)
                        .delete_named("person.reference.occupation.delete_occupation", occupation::delete_occupation),
                ),
        )
        .push(
            Router::with_path("profession")
                .get_named("person.reference.profession.list_profession", profession::list_profession)
                .post_named("person.reference.profession.create_profession", profession::create_profession)
                .push(
                    Router::with_path("options")
                        .post_named("person.reference.profession.options_profession", profession::options_profession),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.reference.profession.get_profession", profession::get_profession)
                        .put_named("person.reference.profession.update_profession", profession::update_profession)
                        .delete_named("person.reference.profession.delete_profession", profession::delete_profession),
                ),
        )
        .push(
            Router::with_path("relative-type")
                .get_named("person.reference.relative_type.list_relative_type", relative_type::list_relative_type)
                .post_named("person.reference.relative_type.create_relative_type", relative_type::create_relative_type)
                .push(
                    Router::with_path("options")
                        .post_named("person.reference.relative_type.options_relative_type", relative_type::options_relative_type),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.reference.relative_type.get_relative_type", relative_type::get_relative_type)
                        .put_named("person.reference.relative_type.update_relative_type", relative_type::update_relative_type)
                        .delete_named("person.reference.relative_type.delete_relative_type", relative_type::delete_relative_type),
                ),
        )
        .push(
            Router::with_path("religion")
                .get_named("person.reference.religion.list_religion", religion::list_religion)
                .post_named("person.reference.religion.create_religion", religion::create_religion)
                .push(
                    Router::with_path("options")
                        .post_named("person.reference.religion.options_religion", religion::options_religion),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("person.reference.religion.get_religion", religion::get_religion)
                        .put_named("person.reference.religion.update_religion", religion::update_religion)
                        .delete_named("person.reference.religion.delete_religion", religion::delete_religion),
                ),
        )
}
