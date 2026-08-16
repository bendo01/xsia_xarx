use salvo::prelude::*;
use crate::config::jwt::{JwtConfig, verify_token};

pub struct JwtAuth;

#[async_trait]
impl Handler for JwtAuth {
    async fn handle(
        &self,
        req: &mut Request,
        depot: &mut Depot,
        res: &mut Response,
        ctrl: &mut FlowCtrl,
    ) {
        let auth_header = req.header::<String>("authorization");
        if let Some(token) = auth_header.as_deref().and_then(|s| s.strip_prefix("Bearer ")) {
            let jwt_config = JwtConfig::from_env();
            
            match verify_token(token, &jwt_config) {
                Ok(claims) => {
                    depot.insert("current_user_id", claims.sub);
                    ctrl.call_next(req, depot, res).await;
                    return;
                }
                Err(_) => {
                    res.render(StatusError::unauthorized().brief("Invalid token"));
                    ctrl.skip_rest();
                    return;
                }
            }
        }

        res.render(StatusError::unauthorized().brief("Missing or invalid authorization header"));
        ctrl.skip_rest();
    }
}
