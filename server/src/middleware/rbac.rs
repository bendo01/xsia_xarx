use salvo::http::Method;
use salvo::prelude::*;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder};
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

        // 3. Fetch user's roles (by user_id and active current_role_id)
        let mut user_roles: Vec<role::Model> = role::Entity::find()
            .filter(role::Column::UserId.eq(user_id))
            .filter(role::Column::DeletedAt.is_null())
            .order_by_asc(role::Column::CreatedAt)
            .all(&db)
            .await
            .unwrap_or_default();

        if let Some(active_rid) = current_user.current_role_id {
            if !active_rid.is_nil() && !user_roles.iter().any(|r| r.id == active_rid) {
                if let Ok(Some(active_role)) = role::Entity::find_by_id(active_rid)
                    .filter(role::Column::DeletedAt.is_null())
                    .one(&db)
                    .await
                {
                    user_roles.push(active_role);
                }
            }
        }

        // Check if user has an admin / superadmin role (bypass)
        let is_admin = user_roles.iter().any(|r| {
            let name = r.name.to_lowercase();
            let name_clean = name.replace([' ', '-', '_'], "");
            name_clean == "superadmin"
                || name_clean == "admin"
                || name_clean == "administrator"
                || name.contains("admin")
                || name.contains("administrator")
        });

        if is_admin {
            ctrl.call_next(req, depot, res).await;
            return;
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

        // Check role-based capabilities across all user roles
        let mut is_student = user_roles.iter().any(|r| {
            let name = r.name.to_lowercase();
            let roleable = r.roleable_type.as_deref().unwrap_or_default().to_lowercase();
            name.contains("student")
                || name.contains("mahasiswa")
                || name.contains("siswa")
                || name.contains("mhs")
                || roleable == "student"
                || roleable == "mahasiswa"
        });

        // Also check if user is linked to a student record via individual_id
        if !is_student && !current_user.individual_id.is_nil() {
            if let Ok(Some(_)) = crate::models::academic::student::master::students::Entity::find()
                .filter(crate::models::academic::student::master::students::Column::IndividualId.eq(current_user.individual_id))
                .filter(crate::models::academic::student::master::students::Column::DeletedAt.is_null())
                .one(&db)
                .await
            {
                is_student = true;
            }
        }

        let is_lecturer = user_roles.iter().any(|r| {
            let name = r.name.to_lowercase();
            let roleable = r.roleable_type.as_deref().unwrap_or_default().to_lowercase();
            name.contains("lecturer")
                || name.contains("dosen")
                || name.contains("pengajar")
                || name.contains("guru")
                || roleable == "lecturer"
                || roleable == "dosen"
        });

        let is_department = user_roles.iter().any(|r| {
            let name = r.name.to_lowercase();
            let roleable = r.roleable_type.as_deref().unwrap_or_default().to_lowercase();
            name.contains("prodi")
                || name.contains("jurusan")
                || name.contains("department")
                || name.contains("baak")
                || name.contains("course")
                || roleable == "staff"
                || roleable == "department"
        });

        let allowed_by_role_capability = if is_student {
            // Student role can access student routes and read academic / institution / building / location catalog
            route_name.starts_with("academic.student.")
                || (action == "read" && (
                    route_name.starts_with("academic.")
                    || route_name.starts_with("institution.")
                    || route_name.starts_with("building.")
                    || route_name.starts_with("location.")
                    || route_name.starts_with("person.")
                    || route_name.starts_with("common.")
                ))
                || route_name.starts_with("person.master.individual")
                || route_name.starts_with("person.master.biodata")
                || route_name.starts_with("auth.user")
        } else if is_lecturer {
            // Lecturer role can access lecturer routes and read catalog / student records
            route_name.starts_with("academic.lecturer.")
                || (action == "read" && (
                    route_name.starts_with("academic.")
                    || route_name.starts_with("institution.")
                    || route_name.starts_with("building.")
                    || route_name.starts_with("location.")
                    || route_name.starts_with("person.")
                    || route_name.starts_with("common.")
                ))
                || route_name.starts_with("person.master.individual")
                || route_name.starts_with("auth.user")
        } else if is_department {
            // Department role can access academic routes and read catalog / records
            route_name.starts_with("academic.")
                || route_name.starts_with("institution.")
                || route_name.starts_with("building.")
                || route_name.starts_with("location.")
                || (action == "read" && (
                    route_name.starts_with("person.")
                    || route_name.starts_with("common.")
                ))
                || route_name.starts_with("person.master.individual")
                || route_name.starts_with("auth.user")
        } else {
            false
        };

        if allowed_by_role_capability {
            ctrl.call_next(req, depot, res).await;
            return;
        }

        // 5. Query user role permissions across all assigned roles
        let role_ids: Vec<Uuid> = user_roles.iter().map(|r| r.id).collect();
        let permissions: Vec<permission::Model> = if role_ids.is_empty() {
            Vec::new()
        } else {
            match permission_role::Entity::find()
                .filter(permission_role::Column::RoleId.is_in(role_ids))
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
            }
        };

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
