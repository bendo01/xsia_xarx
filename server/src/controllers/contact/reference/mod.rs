use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod electronic_mail_types;
pub mod phone_types;
pub mod residence_types;
pub mod website_types;

pub fn router() -> Router {
    Router::with_path("reference")
        .push(
            Router::with_path("electronic-mail-types")
                .get_named("contact.reference.electronic_mail_types.list_electronic_mail_types", electronic_mail_types::list_electronic_mail_types)
                .post_named("contact.reference.electronic_mail_types.create_electronic_mail_type", electronic_mail_types::create_electronic_mail_type)
                .push(
                    Router::with_path("{id}")
                        .get_named("contact.reference.electronic_mail_types.get_electronic_mail_type", electronic_mail_types::get_electronic_mail_type)
                        .put_named("contact.reference.electronic_mail_types.update_electronic_mail_type", electronic_mail_types::update_electronic_mail_type)
                        .delete_named("contact.reference.electronic_mail_types.delete_electronic_mail_type", electronic_mail_types::delete_electronic_mail_type),
                ),
        )
        .push(
            Router::with_path("phone-types")
                .get_named("contact.reference.phone_types.list_phone_types", phone_types::list_phone_types)
                .post_named("contact.reference.phone_types.create_phone_type", phone_types::create_phone_type)
                .push(
                    Router::with_path("{id}")
                        .get_named("contact.reference.phone_types.get_phone_type", phone_types::get_phone_type)
                        .put_named("contact.reference.phone_types.update_phone_type", phone_types::update_phone_type)
                        .delete_named("contact.reference.phone_types.delete_phone_type", phone_types::delete_phone_type),
                ),
        )
        .push(
            Router::with_path("residence-types")
                .get_named("contact.reference.residence_types.list_residence_types", residence_types::list_residence_types)
                .post_named("contact.reference.residence_types.create_residence_type", residence_types::create_residence_type)
                .push(
                    Router::with_path("{id}")
                        .get_named("contact.reference.residence_types.get_residence_type", residence_types::get_residence_type)
                        .put_named("contact.reference.residence_types.update_residence_type", residence_types::update_residence_type)
                        .delete_named("contact.reference.residence_types.delete_residence_type", residence_types::delete_residence_type),
                ),
        )
        .push(
            Router::with_path("website-types")
                .get_named("contact.reference.website_types.list_website_types", website_types::list_website_types)
                .post_named("contact.reference.website_types.create_website_type", website_types::create_website_type)
                .push(
                    Router::with_path("{id}")
                        .get_named("contact.reference.website_types.get_website_type", website_types::get_website_type)
                        .put_named("contact.reference.website_types.update_website_type", website_types::update_website_type)
                        .delete_named("contact.reference.website_types.delete_website_type", website_types::delete_website_type),
                ),
        )
}
