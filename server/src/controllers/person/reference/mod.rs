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
                .named("person.reference.age_classification")
                .get(age_classification::list_age_classification)
                .post(age_classification::create_age_classification)
                .push(
                    Router::with_path("{id}")
                        .get(age_classification::get_age_classification)
                        .put(age_classification::update_age_classification)
                        .delete(age_classification::delete_age_classification),
                ),
        )
        .push(
            Router::with_path("blood-type")
                .named("person.reference.blood_type")
                .get(blood_type::list_blood_type)
                .post(blood_type::create_blood_type)
                .push(
                    Router::with_path("{id}")
                        .get(blood_type::get_blood_type)
                        .put(blood_type::update_blood_type)
                        .delete(blood_type::delete_blood_type),
                ),
        )
        .push(
            Router::with_path("eye-color")
                .named("person.reference.eye_color")
                .get(eye_color::list_eye_color)
                .post(eye_color::create_eye_color)
                .push(
                    Router::with_path("{id}")
                        .get(eye_color::get_eye_color)
                        .put(eye_color::update_eye_color)
                        .delete(eye_color::delete_eye_color),
                ),
        )
        .push(
            Router::with_path("gender")
                .named("person.reference.gender")
                .get(gender::list_gender)
                .post(gender::create_gender)
                .push(
                    Router::with_path("{id}")
                        .get(gender::get_gender)
                        .put(gender::update_gender)
                        .delete(gender::delete_gender),
                ),
        )
        .push(
            Router::with_path("hair-color")
                .named("person.reference.hair_color")
                .get(hair_color::list_hair_color)
                .post(hair_color::create_hair_color)
                .push(
                    Router::with_path("{id}")
                        .get(hair_color::get_hair_color)
                        .put(hair_color::update_hair_color)
                        .delete(hair_color::delete_hair_color),
                ),
        )
        .push(
            Router::with_path("hair-type")
                .named("person.reference.hair_type")
                .get(hair_type::list_hair_type)
                .post(hair_type::create_hair_type)
                .push(
                    Router::with_path("{id}")
                        .get(hair_type::get_hair_type)
                        .put(hair_type::update_hair_type)
                        .delete(hair_type::delete_hair_type),
                ),
        )
        .push(
            Router::with_path("identification-type")
                .named("person.reference.identification_type")
                .get(identification_type::list_identification_type)
                .post(identification_type::create_identification_type)
                .push(
                    Router::with_path("{id}")
                        .get(identification_type::get_identification_type)
                        .put(identification_type::update_identification_type)
                        .delete(identification_type::delete_identification_type),
                ),
        )
        .push(
            Router::with_path("income")
                .named("person.reference.income")
                .get(income::list_income)
                .post(income::create_income)
                .push(
                    Router::with_path("{id}")
                        .get(income::get_income)
                        .put(income::update_income)
                        .delete(income::delete_income),
                ),
        )
        .push(
            Router::with_path("marital-status")
                .named("person.reference.marital_status")
                .get(marital_status::list_marital_status)
                .post(marital_status::create_marital_statu)
                .push(
                    Router::with_path("{id}")
                        .get(marital_status::get_marital_statu)
                        .put(marital_status::update_marital_statu)
                        .delete(marital_status::delete_marital_statu),
                ),
        )
        .push(
            Router::with_path("occupation")
                .named("person.reference.occupation")
                .get(occupation::list_occupation)
                .post(occupation::create_occupation)
                .push(
                    Router::with_path("{id}")
                        .get(occupation::get_occupation)
                        .put(occupation::update_occupation)
                        .delete(occupation::delete_occupation),
                ),
        )
        .push(
            Router::with_path("profession")
                .named("person.reference.profession")
                .get(profession::list_profession)
                .post(profession::create_profession)
                .push(
                    Router::with_path("{id}")
                        .get(profession::get_profession)
                        .put(profession::update_profession)
                        .delete(profession::delete_profession),
                ),
        )
        .push(
            Router::with_path("relative-type")
                .named("person.reference.relative_type")
                .get(relative_type::list_relative_type)
                .post(relative_type::create_relative_type)
                .push(
                    Router::with_path("{id}")
                        .get(relative_type::get_relative_type)
                        .put(relative_type::update_relative_type)
                        .delete(relative_type::delete_relative_type),
                ),
        )
        .push(
            Router::with_path("religion")
                .named("person.reference.religion")
                .get(religion::list_religion)
                .post(religion::create_religion)
                .push(
                    Router::with_path("{id}")
                        .get(religion::get_religion)
                        .put(religion::update_religion)
                        .delete(religion::delete_religion),
                ),
        )
}
