use std::collections::BTreeSet;
use std::sync::{LazyLock, Mutex};

use salvo::http::Method;
use salvo::prelude::*;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder};
use uuid::Uuid;

use crate::models::auth::{permission, permission_position_type, permission_role, role, user};

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

// Every route name passed to `named()`, collected while routers are built
static REGISTERED_ROUTE_NAMES: LazyLock<Mutex<BTreeSet<&'static str>>> = LazyLock::new(|| Mutex::new(BTreeSet::new()));

/// Route names registered so far; build the routers (e.g. `controllers::api_routers()`) before calling
pub fn registered_route_names() -> Vec<&'static str> {
    REGISTERED_ROUTE_NAMES.lock().map(|names| names.iter().copied().collect()).unwrap_or_default()
}

pub trait NamedRouterExt {
    /// Attach a route name (e.g. "person.reference.gender") and RBAC protection to the Router
    fn named(self, name: &'static str) -> Self;

    /// Attach a named GET handler to a new child route
    fn get_named(self, name: &'static str, handler: impl Handler + 'static) -> Self;

    /// Attach a named POST handler to a new child route
    fn post_named(self, name: &'static str, handler: impl Handler + 'static) -> Self;

    /// Attach a named PUT handler to a new child route
    fn put_named(self, name: &'static str, handler: impl Handler + 'static) -> Self;

    /// Attach a named PATCH handler to a new child route
    fn patch_named(self, name: &'static str, handler: impl Handler + 'static) -> Self;

    /// Attach a named DELETE handler to a new child route
    fn delete_named(self, name: &'static str, handler: impl Handler + 'static) -> Self;
}

impl NamedRouterExt for Router {
    fn named(self, name: &'static str) -> Self {
        if let Ok(mut names) = REGISTERED_ROUTE_NAMES.lock() {
            names.insert(name);
        }
        self.hoop(RouteName(name)).hoop(RbacGuard)
    }

    fn get_named(self, name: &'static str, handler: impl Handler + 'static) -> Self {
        self.push(Router::new().named(name).get(handler))
    }

    fn post_named(self, name: &'static str, handler: impl Handler + 'static) -> Self {
        self.push(Router::new().named(name).post(handler))
    }

    fn put_named(self, name: &'static str, handler: impl Handler + 'static) -> Self {
        self.push(Router::new().named(name).put(handler))
    }

    fn patch_named(self, name: &'static str, handler: impl Handler + 'static) -> Self {
        self.push(Router::new().named(name).patch(handler))
    }

    fn delete_named(self, name: &'static str, handler: impl Handler + 'static) -> Self {
        self.push(Router::new().named(name).delete(handler))
    }
}

// ── 2. RBAC Guard Middleware ──────────────────────────────────────────────────

/// Position type whose roles bypass every permission check
pub const ADMINISTRATOR_POSITION_TYPE_ID: Uuid = uuid::uuid!("bf76efdc-2c2e-41ec-8115-b1bc13182983");

pub fn is_administrator(role: &role::Model) -> bool {
    role.position_type_id == Some(ADMINISTRATOR_POSITION_TYPE_ID)
}

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
            && perm.is_open {
                ctrl.call_next(req, depot, res).await;
                return;
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

        // 3. Resolve the single active role. Permissions are never merged across a user's roles,
        //    so a user holding both Dosen and Mahasiswa only gets the rights of the role they selected.
        let owned_roles: Vec<role::Model> = role::Entity::find()
            .filter(role::Column::UserId.eq(user_id))
            .filter(role::Column::DeletedAt.is_null())
            .order_by_asc(role::Column::CreatedAt)
            .all(&db)
            .await
            .unwrap_or_default();

        let active_role = match current_user.current_role_id.filter(|id| !id.is_nil()) {
            Some(active_rid) => owned_roles.iter().find(|r| r.id == active_rid).cloned(),
            None if owned_roles.len() == 1 => owned_roles.first().cloned(),
            None => None,
        };

        let Some(active_role) = active_role else {
            res.render(StatusError::forbidden().brief(if owned_roles.is_empty() {
                "Access denied: user has no role"
            } else {
                "Access denied: select an active role first"
            }));
            ctrl.skip_rest();
            return;
        };

        depot.insert("active_role", active_role.clone());

        // Administrator bypass is bound to the position type, never to the role name
        if is_administrator(&active_role) {
            ctrl.call_next(req, depot, res).await;
            return;
        }

        // 4. Determine action based on HTTP Method
        let mut action = match *req.method() {
            Method::GET => "read",
            Method::POST => "create",
            Method::PUT | Method::PATCH => "update",
            Method::DELETE => "delete",
            _ => "other",
        };

        if route_name.contains(".options_") {
            action = "read";
        }

        let action_permission = format!("{}.{}", route_name, action);
        let wildcard_permission = format!("{}.*", route_name);

        // 5. Permissions granted directly to the active role
        let mut permissions: Vec<permission::Model> = match permission_role::Entity::find()
            .filter(permission_role::Column::RoleId.eq(active_role.id))
            .filter(permission_role::Column::DeletedAt.is_null())
            .find_also_related(permission::Entity)
            .filter(permission::Column::DeletedAt.is_null())
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

        // 6. Permissions granted to the active role's position type
        if let Some(position_type_id) = active_role.position_type_id {
            match permission_position_type::Entity::find()
                .filter(permission_position_type::Column::PositionTypeId.eq(position_type_id))
                .filter(permission_position_type::Column::DeletedAt.is_null())
                .find_also_related(permission::Entity)
                .filter(permission::Column::DeletedAt.is_null())
                .all(&db)
                .await
            {
                Ok(list) => permissions.extend(list.into_iter().filter_map(|(_, p)| p)),
                Err(e) => {
                    res.render(StatusError::internal_server_error().brief(e.to_string()));
                    ctrl.skip_rest();
                    return;
                }
            }
        }

        let has_permission = permissions.iter().any(|p| {
            p.name == "*"
                || p.name == route_name
                || p.name == action_permission
                || p.name == wildcard_permission
                || (p.name.ends_with(".*") && route_name.starts_with(&p.name[..p.name.len() - 1]))
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
