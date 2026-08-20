use salvo::http::Method;
use salvo::prelude::*;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};
use uuid::Uuid;

use crate::models::auth::{permission, permission_role, role, user};

// ── 1. Route Name Middleware & Extension Trait ───────────────────────────────

#[derive(Clone, Copy, Debug)]
pub struct RouteName(pub &'static str);

#[async_trait]
impl Handler for RouteName {
    async fn handle(
        &self,
        req: &mut Request,
        depot: &mut Depot,
        res: &mut Response,
        ctrl: &mut FlowCtrl,
    ) {
        depot.insert("route_name", self.0);
        ctrl.call_next(req, depot, res).await;
    }
}

pub trait NamedRouterExt {
    /// Attach a route name (e.g. "person.reference.gender") and RBAC protection to the Router
    fn named(self, name: &'static str) -> Self;
}

impl NamedRouterExt for Router {
    fn named(self, name: &'static str) -> Self {
        self.hoop(RouteName(name)).hoop(RbacGuard)
    }
}

// ── 2. RBAC Guard Middleware ──────────────────────────────────────────────────

pub struct RbacGuard;

#[async_trait]
impl Handler for RbacGuard {
    async fn handle(
        &self,
        req: &mut Request,
        depot: &mut Depot,
        res: &mut Response,
        ctrl: &mut FlowCtrl,
    ) {
        // If route has no route_name attached, allow request through
        let route_name = match depot.get::<&'static str>("route_name") {
            Ok(name) => *name,
            Err(_) => {
                ctrl.call_next(req, depot, res).await;
                return;
            }
        };

        let db = match depot.get_typed::<DatabaseConnection>() {
            Ok(db) => db.clone(),
            Err(_) => {
                res.render(StatusError::internal_server_error().brief("Database connection missing"));
                ctrl.skip_rest();
                return;
            }
        };

        // 1. Check if permission is globally open / public
        if let Ok(Some(perm)) = permission::Entity::find()
            .filter(permission::Column::Name.eq(route_name))
            .filter(permission::Column::DeletedAt.is_null())
            .one(&db)
            .await
        {
            if perm.is_open {
                ctrl.call_next(req, depot, res).await;
                return;
            }
        }

        // 2. Extract authenticated user
        let user_id = match depot.get::<Uuid>("current_user_id") {
            Ok(id) => *id,
            Err(_) => {
                let auth_header = req.header::<String>("authorization");
                if let Some(token) = auth_header.as_deref().and_then(|s| s.strip_prefix("Bearer ")) {
                    let jwt_config = crate::config::jwt::JwtConfig::from_env();
                    match crate::config::jwt::verify_token(token, &jwt_config) {
                        Ok(claims) => {
                            depot.insert("current_user_id", claims.sub);
                            claims.sub
                        }
                        Err(_) => {
                            res.render(StatusError::unauthorized().brief("Invalid token"));
                            ctrl.skip_rest();
                            return;
                        }
                    }
                } else {
                    res.render(StatusError::unauthorized().brief("Missing or invalid authentication token"));
                    ctrl.skip_rest();
                    return;
                }
            }
        };

        let current_user = match user::Entity::find_by_id(user_id)
            .filter(user::Column::DeletedAt.is_null())
            .one(&db)
            .await
        {
            Ok(Some(u)) => u,
            _ => {
                res.render(StatusError::unauthorized().brief("User not found"));
                ctrl.skip_rest();
                return;
            }
        };

        let role_id = match current_user.current_role_id {
            Some(rid) => rid,
            None => {
                res.render(StatusError::forbidden().brief("User has no active role assigned"));
                ctrl.skip_rest();
                return;
            }
        };

        // 3. Check if active role is Superadmin / Admin (bypass check)
        if let Ok(Some(current_role)) = role::Entity::find_by_id(role_id)
            .filter(role::Column::DeletedAt.is_null())
            .one(&db)
            .await
        {
            let role_name_lower = current_role.name.to_lowercase();
            if role_name_lower == "superadmin" || role_name_lower == "admin" {
                ctrl.call_next(req, depot, res).await;
                return;
            }
        }

        // 4. Determine action based on HTTP Method
        let action = match *req.method() {
            Method::GET => "read",
            Method::POST => "create",
            Method::PUT | Method::PATCH => "update",
            Method::DELETE => "delete",
            _ => "other",
        };

        let action_permission = format!("{}.{}", route_name, action);
        let wildcard_permission = format!("{}.*", route_name);

        // 5. Query user role permissions
        let permissions: Vec<permission::Model> = match permission_role::Entity::find()
            .inner_join(permission::Entity)
            .filter(permission_role::Column::RoleId.eq(role_id))
            .filter(permission_role::Column::DeletedAt.is_null())
            .filter(permission::Column::DeletedAt.is_null())
            .find_also_related(permission::Entity)
            .all(&db)
            .await
        {
            Ok(list) => list.into_iter().filter_map(|(_, p)| p).collect(),
            Err(e) => {
                res.render(StatusError::internal_server_error().brief(e.to_string()));
                ctrl.skip_rest();
                return;
            }
        };

        let has_permission = permissions.iter().any(|p| {
            p.name == "*"
                || p.name == route_name
                || p.name == action_permission
                || p.name == wildcard_permission
        });

        if has_permission {
            ctrl.call_next(req, depot, res).await;
        } else {
            res.render(
                StatusError::forbidden().brief(format!(
                    "Access denied: role lacks permission '{}' or '{}'",
                    route_name, action_permission
                )),
            );
            ctrl.skip_rest();
        }
    }
}
