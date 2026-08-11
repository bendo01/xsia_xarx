use salvo::prelude::*;

pub mod electronic_mails;
pub mod phones;
pub mod residences;
pub mod websites;

pub fn router() -> Router {
    Router::with_path("master")
        .push(
            Router::with_path("electronic-mails")
                .get(electronic_mails::list_electronic_mails)
                .post(electronic_mails::create_electronic_mail)
                .push(
                    Router::with_path("{id}")
                        .get(electronic_mails::get_electronic_mail)
                        .put(electronic_mails::update_electronic_mail)
                        .delete(electronic_mails::delete_electronic_mail),
                ),
        )
        .push(
            Router::with_path("phones")
                .get(phones::list_phones)
                .post(phones::create_phone)
                .push(
                    Router::with_path("{id}")
                        .get(phones::get_phone)
                        .put(phones::update_phone)
                        .delete(phones::delete_phone),
                ),
        )
        .push(
            Router::with_path("residences")
                .get(residences::list_residences)
                .post(residences::create_residence)
                .push(
                    Router::with_path("{id}")
                        .get(residences::get_residence)
                        .put(residences::update_residence)
                        .delete(residences::delete_residence),
                ),
        )
        .push(
            Router::with_path("websites")
                .get(websites::list_websites)
                .post(websites::create_website)
                .push(
                    Router::with_path("{id}")
                        .get(websites::get_website)
                        .put(websites::update_website)
                        .delete(websites::delete_website),
                ),
        )
}
