use salvo::prelude::*;

pub mod electronic_mail_types;
pub mod phone_types;
pub mod residence_types;
pub mod website_types;

pub fn router() -> Router {
    Router::with_path("reference")
        .push(
            Router::with_path("electronic-mail-types")
                .get(electronic_mail_types::list_electronic_mail_types)
                .post(electronic_mail_types::create_electronic_mail_type)
                .push(
                    Router::with_path("{id}")
                        .get(electronic_mail_types::get_electronic_mail_type)
                        .put(electronic_mail_types::update_electronic_mail_type)
                        .delete(electronic_mail_types::delete_electronic_mail_type),
                ),
        )
        .push(
            Router::with_path("phone-types")
                .get(phone_types::list_phone_types)
                .post(phone_types::create_phone_type)
                .push(
                    Router::with_path("{id}")
                        .get(phone_types::get_phone_type)
                        .put(phone_types::update_phone_type)
                        .delete(phone_types::delete_phone_type),
                ),
        )
        .push(
            Router::with_path("residence-types")
                .get(residence_types::list_residence_types)
                .post(residence_types::create_residence_type)
                .push(
                    Router::with_path("{id}")
                        .get(residence_types::get_residence_type)
                        .put(residence_types::update_residence_type)
                        .delete(residence_types::delete_residence_type),
                ),
        )
        .push(
            Router::with_path("website-types")
                .get(website_types::list_website_types)
                .post(website_types::create_website_type)
                .push(
                    Router::with_path("{id}")
                        .get(website_types::get_website_type)
                        .put(website_types::update_website_type)
                        .delete(website_types::delete_website_type),
                ),
        )
}
