use salvo::prelude::*;

use crate::config::mail_in_a_box::MailInABoxConfig;
use crate::config::openwa::OpenwaConfig;

pub mod mail_in_a_box;
pub mod openwa;
pub mod signature;

/// Puts a webhook's settings in the depot for the handlers below
struct InjectConfig<T>(T);

#[async_trait]
impl<T: Clone + Send + Sync + 'static> Handler for InjectConfig<T> {
    async fn handle(
        &self,
        req: &mut Request,
        depot: &mut Depot,
        res: &mut Response,
        ctrl: &mut FlowCtrl,
    ) {
        depot.insert_typed::<T>(self.0.clone());
        ctrl.call_next(req, depot, res).await;
    }
}

/// Inbound webhooks. These are called by other servers, so they authenticate with
/// a shared secret instead of a user JWT and are not RBAC-named routes.
/// Each request reads the secrets from the database (falling back to the
/// environment), so a changed secret applies without a restart.
pub fn router() -> Router {
    Router::with_path("webhook")
        .push(Router::with_path("mail-in-a-box").post(mail_in_a_box::receive))
        .push(Router::with_path("openwa").post(openwa::receive))
}

/// Like [`router`], but with fixed settings instead of database lookups (used by tests).
pub fn router_with_config(
    mail_in_a_box_config: MailInABoxConfig,
    openwa_config: OpenwaConfig,
) -> Router {
    Router::with_path("webhook")
        .push(
            Router::with_path("mail-in-a-box")
                .hoop(InjectConfig(mail_in_a_box_config))
                .post(mail_in_a_box::receive),
        )
        .push(
            Router::with_path("openwa")
                .hoop(InjectConfig(openwa_config))
                .post(openwa::receive),
        )
}
