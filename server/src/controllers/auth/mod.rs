use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod permission;
pub mod permission_position_type;
pub mod permission_role;
pub mod role;
pub mod user;

pub fn router() -> Router {
    Router::with_path("")
        .push(
            Router::with_path("permission")
                .get_named("auth.permission.index", permission::index)
                .post_named("auth.permission.store", permission::store)
                .push(
                    Router::with_path("options")
                        .post_named("auth.permission.option_select", permission::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("auth.permission.show", permission::show)
                        .put_named("auth.permission.update", permission::update)
                        .delete_named("auth.permission.delete", permission::delete),
                ),
        )
        .push(
            Router::with_path("permission-role")
                .get_named("auth.permission_role.index", permission_role::index)
                .post_named("auth.permission_role.store", permission_role::store)
                .push(
                    Router::with_path("options")
                        .post_named("auth.permission_role.option_select", permission_role::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("auth.permission_role.show", permission_role::show)
                        .put_named("auth.permission_role.update", permission_role::update)
                        .delete_named("auth.permission_role.delete", permission_role::delete),
                ),
        )
        .push(
            Router::with_path("permission-position-type")
                .get_named("auth.permission_position_type.index", permission_position_type::index)
                .post_named("auth.permission_position_type.store", permission_position_type::store)
                .push(
                    Router::with_path("options")
                        .post_named("auth.permission_position_type.option_select", permission_position_type::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("auth.permission_position_type.show", permission_position_type::show)
                        .delete_named("auth.permission_position_type.delete", permission_position_type::delete),
                ),
        )
        .push(
            Router::with_path("user")
                .get_named("auth.user.index", user::index)
                .push(
                    Router::with_path("options")
                        .post_named("auth.user.option_select", user::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("auth.user.show", user::show)
                        .put_named("auth.user.update", user::update)
                        .delete_named("auth.user.delete", user::delete),
                ),
        )
        // Public Auth Endpoints
        .push(Router::with_path("register").post(user::register))
        .push(Router::with_path("login").post(user::login))
        .push(Router::with_path("login-with-session").post(user::login_with_session))
        .push(Router::with_path("verify/{token}").get(user::verify_email))
        .push(Router::with_path("forgot-password").post(user::forgot_password))
        .push(Router::with_path("reset-password").post(user::reset_password))
        .push(Router::with_path("resend-verification-token").post(user::resend_verification_token))
        .push(Router::with_path("account_acquisition").post(user::account_acquisition))
        // Protected Auth Endpoints
        .push(
            Router::with_path("current")
                .hoop(crate::middleware::auth::JwtAuth)
                .get(user::current_user)
        )
        .push(
            Router::with_path("user/set_current_role/{role_id}")
                .hoop(crate::middleware::auth::JwtAuth)
                .get(user::set_current_role)
                .post(user::set_current_role)
                .put(user::set_current_role)
        )
        .push(
            Router::with_path("role")
                .get_named("auth.role.index", role::index)
                .post_named("auth.role.store", role::store)
                .push(
                    Router::with_path("options")
                        .post_named("auth.role.option_select", role::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("auth.role.show", role::show)
                        .put_named("auth.role.update", role::update)
                        .delete_named("auth.role.delete", role::delete),
                ),
        )
}
