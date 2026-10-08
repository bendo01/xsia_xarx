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
                .get_named("contact.reference.electronic_mail_types.index", electronic_mail_types::index)
                .post_named("contact.reference.electronic_mail_types.store", electronic_mail_types::store)
                .push(
                    Router::with_path("options")
                        .post_named("contact.reference.electronic_mail_types.option_select", electronic_mail_types::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("contact.reference.electronic_mail_types.show", electronic_mail_types::show)
                        .put_named("contact.reference.electronic_mail_types.update", electronic_mail_types::update)
                        .delete_named("contact.reference.electronic_mail_types.delete", electronic_mail_types::delete),
                ),
        )
        .push(
            Router::with_path("phone-types")
                .get_named("contact.reference.phone_types.index", phone_types::index)
                .post_named("contact.reference.phone_types.store", phone_types::store)
                .push(
                    Router::with_path("options")
                        .post_named("contact.reference.phone_types.option_select", phone_types::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("contact.reference.phone_types.show", phone_types::show)
                        .put_named("contact.reference.phone_types.update", phone_types::update)
                        .delete_named("contact.reference.phone_types.delete", phone_types::delete),
                ),
        )
        .push(
            Router::with_path("residence-types")
                .get_named("contact.reference.residence_types.index", residence_types::index)
                .post_named("contact.reference.residence_types.store", residence_types::store)
                .push(
                    Router::with_path("options")
                        .post_named("contact.reference.residence_types.option_select", residence_types::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("contact.reference.residence_types.show", residence_types::show)
                        .put_named("contact.reference.residence_types.update", residence_types::update)
                        .delete_named("contact.reference.residence_types.delete", residence_types::delete),
                ),
        )
        .push(
            Router::with_path("website-types")
                .get_named("contact.reference.website_types.index", website_types::index)
                .post_named("contact.reference.website_types.store", website_types::store)
                .push(
                    Router::with_path("options")
                        .post_named("contact.reference.website_types.option_select", website_types::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("contact.reference.website_types.show", website_types::show)
                        .put_named("contact.reference.website_types.update", website_types::update)
                        .delete_named("contact.reference.website_types.delete", website_types::delete),
                ),
        )
}
