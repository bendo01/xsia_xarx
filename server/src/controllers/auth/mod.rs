use salvo::prelude::*;

pub mod permission;
pub mod permission_role;
pub mod role;
pub mod user;

pub fn router() -> Router {
    Router::with_path("")
        .push(
            Router::with_path("permission")
                .get(permission::list_permission)
                .post(permission::create_permission)
                .push(
                    Router::with_path("{id}")
                        .get(permission::get_permission)
                        .put(permission::update_permission)
                        .delete(permission::delete_permission),
                ),
        )
        .push(
            Router::with_path("permission-role")
                .get(permission_role::list_permission_role)
                .post(permission_role::create_permission_role)
                .push(
                    Router::with_path("{id}")
                        .get(permission_role::get_permission_role)
                        .put(permission_role::update_permission_role)
                        .delete(permission_role::delete_permission_role),
                ),
        )
        .push(
            Router::with_path("user")
                .get(user::list_user)
                .push(
                    Router::with_path("{id}")
                        .get(user::get_user)
                        .put(user::update_user)
                        .delete(user::delete_user),
                ),
        )
        // Public Auth Endpoints
        .push(Router::with_path("register").post(user::register))
        .push(Router::with_path("login").post(user::login))
        .push(Router::with_path("verify/{token}").get(user::verify_email))
        .push(Router::with_path("forgot").post(user::forgot_password))
        .push(Router::with_path("reset").post(user::reset_password))
        .push(Router::with_path("resend-verification-mail").post(user::resend_verification_mail))
        // Protected Auth Endpoints
        .push(
            Router::with_path("current")
                .hoop(crate::middleware::auth::JwtAuth)
                .get(user::current_user)
        )
        .push(
            Router::with_path("role")
                .get(role::list_role)
                .post(role::create_role)
                .push(
                    Router::with_path("{id}")
                        .get(role::get_role)
                        .put(role::update_role)
                        .delete(role::delete_role),
                ),
        )
}
