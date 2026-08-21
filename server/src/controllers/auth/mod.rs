use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod permission;
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
                    Router::with_path("{id}")
                        .get_named("auth.permission_role.get_permission_role", permission_role::get_permission_role)
                        .put_named("auth.permission_role.update_permission_role", permission_role::update_permission_role)
                        .delete_named("auth.permission_role.delete_permission_role", permission_role::delete_permission_role),
                ),
        )
        .push(
            Router::with_path("user")
                .get_named("auth.user.list_user", user::list_user)
                .push(
                    Router::with_path("{id}")
                        .get_named("auth.user.get_user", user::get_user)
                        .put_named("auth.user.update_user", user::update_user)
                        .delete_named("auth.user.delete_user", user::delete_user),
                ),
        )
        // Public Auth Endpoints
        .push(Router::with_path("register").post_named("auth.user.register", user::register))
        .push(Router::with_path("login").post_named("auth.user.login", user::login))
        .push(Router::with_path("verify/{token}").get_named("auth.user.verify_email", user::verify_email))
        .push(Router::with_path("forgot").post_named("auth.user.forgot_password", user::forgot_password))
        .push(Router::with_path("reset").post_named("auth.user.reset_password", user::reset_password))
        .push(Router::with_path("resend-verification-mail").post_named("auth.user.resend_verification_mail", user::resend_verification_mail))
        // Protected Auth Endpoints
        .push(
            Router::with_path("current")
                .hoop(crate::middleware::auth::JwtAuth)
                .get_named("auth.user.current_user", user::current_user)
        )
        .push(
            Router::with_path("role")
                .get_named("auth.role.list_role", role::list_role)
                .post_named("auth.role.create_role", role::create_role)
                .push(
                    Router::with_path("{id}")
                        .get_named("auth.role.get_role", role::get_role)
                        .put_named("auth.role.update_role", role::update_role)
                        .delete_named("auth.role.delete_role", role::delete_role),
                ),
        )
}
