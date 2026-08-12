use salvo::prelude::*;

pub mod permission;
pub mod permission_user;
pub mod user;
pub mod user_position_type;

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
            Router::with_path("permission-user")
                .get(permission_user::list_permission_user)
                .post(permission_user::create_permission_user)
                .push(
                    Router::with_path("{id}")
                        .get(permission_user::get_permission_user)
                        .put(permission_user::update_permission_user)
                        .delete(permission_user::delete_permission_user),
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
            Router::with_path("user-position-type")
                .get(user_position_type::list_user_position_type)
                .post(user_position_type::create_user_position_type)
                .push(
                    Router::with_path("{id}")
                        .get(user_position_type::get_user_position_type)
                        .put(user_position_type::update_user_position_type)
                        .delete(user_position_type::delete_user_position_type),
                ),
        )
}
