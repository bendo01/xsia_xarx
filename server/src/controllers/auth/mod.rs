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
                .get_named("auth.permission.list_permission", permission::list_permission)
                .post_named("auth.permission.create_permission", permission::create_permission)
                .push(
                    Router::with_path("options")
                        .post_named("auth.permission.options_permission", permission::options_permission),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("auth.permission.get_permission", permission::get_permission)
                        .put_named("auth.permission.update_permission", permission::update_permission)
                        .delete_named("auth.permission.delete_permission", permission::delete_permission),
                ),
        )
        .push(
            Router::with_path("permission-role")
                .get_named("auth.permission_role.list_permission_role", permission_role::list_permission_role)
                .post_named("auth.permission_role.create_permission_role", permission_role::create_permission_role)
                .push(
                    Router::with_path("options")
                        .post_named("auth.permission_role.options_permission_role", permission_role::options_permission_role),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("auth.permission_role.get_permission_role", permission_role::get_permission_role)
                        .put_named("auth.permission_role.update_permission_role", permission_role::update_permission_role)
                        .delete_named("auth.permission_role.delete_permission_role", permission_role::delete_permission_role),
                ),
        )
        .push(
            Router::with_path("permission-position-type")
                .get_named("auth.permission_position_type.list_permission_position_type", permission_position_type::list_permission_position_type)
                .post_named("auth.permission_position_type.create_permission_position_type", permission_position_type::create_permission_position_type)
                .push(
                    Router::with_path("options")
                        .post_named("auth.permission_position_type.options_permission_position_type", permission_position_type::options_permission_position_type),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("auth.permission_position_type.get_permission_position_type", permission_position_type::get_permission_position_type)
                        .delete_named("auth.permission_position_type.delete_permission_position_type", permission_position_type::delete_permission_position_type),
                ),
        )
        .push(
            Router::with_path("user")
                .get_named("auth.user.list_user", user::list_user)
                .push(
                    Router::with_path("options")
                        .post_named("auth.user.options_user", user::options_user),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("auth.user.get_user", user::get_user)
                        .put_named("auth.user.update_user", user::update_user)
                        .delete_named("auth.user.delete_user", user::delete_user),
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
                .get_named("auth.role.list_role", role::list_role)
                .post_named("auth.role.create_role", role::create_role)
                .push(
                    Router::with_path("options")
                        .post_named("auth.role.options_role", role::options_role),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("auth.role.get_role", role::get_role)
                        .put_named("auth.role.update_role", role::update_role)
                        .delete_named("auth.role.delete_role", role::delete_role),
                ),
        )
}
