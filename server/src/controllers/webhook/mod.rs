use salvo::prelude::*;

use crate::config::mail_in_a_box::MailInABoxConfig;

pub mod mail_in_a_box;

/// Puts the Mail-in-a-Box webhook settings in the depot for the handlers below
struct InjectMailInABoxConfig(MailInABoxConfig);

#[async_trait]
impl Handler for InjectMailInABoxConfig {
    async fn handle(
        &self,
        req: &mut Request,
        depot: &mut Depot,
        res: &mut Response,
        ctrl: &mut FlowCtrl,
    ) {
        depot.insert_typed::<MailInABoxConfig>(self.0.clone());
        ctrl.call_next(req, depot, res).await;
    }
}

/// Inbound webhooks. These are called by other servers, so they authenticate with
/// a shared secret instead of a user JWT and are not RBAC-named routes.
pub fn router() -> Router {
    router_with_config(MailInABoxConfig::from_env())
}

pub fn router_with_config(mail_in_a_box_config: MailInABoxConfig) -> Router {
    Router::with_path("webhook").push(
        Router::with_path("mail-in-a-box")
            .hoop(InjectMailInABoxConfig(mail_in_a_box_config))
            .post(mail_in_a_box::receive),
    )
}
