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
                .get_named("contact.master.electronic_mails.list_electronic_mails", electronic_mails::list_electronic_mails)
                .post_named("contact.master.electronic_mails.create_electronic_mail", electronic_mails::create_electronic_mail)
                .push(
                    Router::with_path("{id}")
                        .get_named("contact.master.electronic_mails.get_electronic_mail", electronic_mails::get_electronic_mail)
                        .put_named("contact.master.electronic_mails.update_electronic_mail", electronic_mails::update_electronic_mail)
                        .delete_named("contact.master.electronic_mails.delete_electronic_mail", electronic_mails::delete_electronic_mail),
                ),
        )
        .push(
            Router::with_path("phones")
                .get_named("contact.master.phones.list_phones", phones::list_phones)
                .post_named("contact.master.phones.create_phone", phones::create_phone)
                .push(
                    Router::with_path("{id}")
                        .get_named("contact.master.phones.get_phone", phones::get_phone)
                        .put_named("contact.master.phones.update_phone", phones::update_phone)
                        .delete_named("contact.master.phones.delete_phone", phones::delete_phone),
                ),
        )
        .push(
            Router::with_path("residences")
                .get_named("contact.master.residences.list_residences", residences::list_residences)
                .post_named("contact.master.residences.create_residence", residences::create_residence)
                .push(
                    Router::with_path("{id}")
                        .get_named("contact.master.residences.get_residence", residences::get_residence)
                        .put_named("contact.master.residences.update_residence", residences::update_residence)
                        .delete_named("contact.master.residences.delete_residence", residences::delete_residence),
                ),
        )
        .push(
            Router::with_path("websites")
                .get_named("contact.master.websites.list_websites", websites::list_websites)
                .post_named("contact.master.websites.create_website", websites::create_website)
                .push(
                    Router::with_path("{id}")
                        .get_named("contact.master.websites.get_website", websites::get_website)
                        .put_named("contact.master.websites.update_website", websites::update_website)
                        .delete_named("contact.master.websites.delete_website", websites::delete_website),
                ),
        )
}
