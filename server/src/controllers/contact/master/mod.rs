use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod electronic_mails;
pub mod phones;
pub mod residences;
pub mod websites;

pub fn router() -> Router {
    Router::with_path("master")
        .push(
            Router::with_path("electronic-mails")
                .get_named("contact.master.electronic_mails.index", electronic_mails::index)
                .post_named("contact.master.electronic_mails.store", electronic_mails::store)
                .push(
                    Router::with_path("options")
                        .post_named("contact.master.electronic_mails.option_select", electronic_mails::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("contact.master.electronic_mails.show", electronic_mails::show)
                        .put_named("contact.master.electronic_mails.update", electronic_mails::update)
                        .delete_named("contact.master.electronic_mails.delete", electronic_mails::delete),
                ),
        )
        .push(
            Router::with_path("phones")
                .get_named("contact.master.phones.index", phones::index)
                .post_named("contact.master.phones.store", phones::store)
                .push(
                    Router::with_path("options")
                        .post_named("contact.master.phones.option_select", phones::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("contact.master.phones.show", phones::show)
                        .put_named("contact.master.phones.update", phones::update)
                        .delete_named("contact.master.phones.delete", phones::delete),
                ),
        )
        .push(
            Router::with_path("residences")
                .get_named("contact.master.residences.index", residences::index)
                .post_named("contact.master.residences.store", residences::store)
                .push(
                    Router::with_path("options")
                        .post_named("contact.master.residences.option_select", residences::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("contact.master.residences.show", residences::show)
                        .put_named("contact.master.residences.update", residences::update)
                        .delete_named("contact.master.residences.delete", residences::delete),
                ),
        )
        .push(
            Router::with_path("websites")
                .get_named("contact.master.websites.index", websites::index)
                .post_named("contact.master.websites.store", websites::store)
                .push(
                    Router::with_path("options")
                        .post_named("contact.master.websites.option_select", websites::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("contact.master.websites.show", websites::show)
                        .put_named("contact.master.websites.update", websites::update)
                        .delete_named("contact.master.websites.delete", websites::delete),
                ),
        )
}
