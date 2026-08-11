import os

def to_pascal_case(snake_str):
    if snake_str.endswith("es") and snake_str != "staffes" and snake_str != "residences":
        snake_str = snake_str[:-2]
    elif snake_str.endswith("s") and snake_str != "staffes" and snake_str != "status":
        snake_str = snake_str[:-1]
    
    components = snake_str.split('_')
    return "".join(x.title() for x in components)

def parse_model(file_path):
    fields = []
    with open(file_path, 'r') as f:
        in_struct = False
        for line in f:
            line = line.strip()
            if line.startswith('pub struct Model'):
                in_struct = True
                continue
            if in_struct:
                if line.startswith('}'):
                    break
                if line.startswith('pub ') and ':' in line:
                    if 'BelongsTo<' in line or 'HasMany<' in line or 'HasOne<' in line or 'ManyTo<' in line:
                        continue
                    parts = line.replace('pub ', '').split(':')
                    name = parts[0].strip()
                    type_part = parts[1].split(',')[0].strip()
                    
                    if 'BelongsTo' in type_part or 'HasMany' in type_part:
                        continue
                        
                    fields.append((name, type_part))
    return fields

def rust_type_to_dto(type_str):
    def map_inner(inner):
        if inner == "DateTimeWithTimeZone": return "DateTime<FixedOffset>"
        if inner == "DateTime": return "NaiveDateTime"
        if inner == "Date": return "NaiveDate"
        return inner

    if "Option<" in type_str:
        inner = type_str.split("<")[1].split(">")[0]
        return f"Option<{map_inner(inner)}>"
    else:
        return map_inner(type_str)

def generate_dtos_and_controllers(module, sub_module):
    models_dir = f"/home/bendo01/Project/xsia_xarx/server/src/models/{module}/{sub_module}"
    dtos_dir = f"/home/bendo01/Project/xsia_xarx/server/src/dtos/{module}/{sub_module}"
    controllers_dir = f"/home/bendo01/Project/xsia_xarx/server/src/controllers/{module}/{sub_module}"
    
    os.makedirs(dtos_dir, exist_ok=True)
    os.makedirs(controllers_dir, exist_ok=True)
    
    models = []
    for f in os.listdir(models_dir):
        if f.endswith(".rs") and f not in ["mod.rs", "prelude.rs"]:
            models.append(f[:-3])
            
    models.sort()
    
    mod_rs_content_dtos = ""
    mod_rs_content_ctrls = "use salvo::prelude::*;\n\n"
    router_pushes = []
    
    for mod_name in models:
        model_path = os.path.join(models_dir, f"{mod_name}.rs")
        fields = parse_model(model_path)
        
        pretty_name = to_pascal_case(mod_name)
        
        # Determine if it's reference-like or not
        # Reference-like if sub_module == "reference"
        if sub_module == "reference":
            # For reference we don't generate DTOs, we just use common reference DTOs
            dto_imports = f"""use crate::dtos::common::reference::{{
    CreateReferenceRequest, MessageResponse, PaginatedReferenceResponse, ReferenceQuery,
    ReferenceResponse, UpdateReferenceRequest,
}};"""
            response_type = "ReferenceResponse"
            create_type = "CreateReferenceRequest"
            update_type = "UpdateReferenceRequest"
            query_type = "ReferenceQuery"
            paginated_type = "PaginatedReferenceResponse"
        else:
            mod_rs_content_dtos += f"pub mod {mod_name};\n"
            dto_imports = f"""use crate::dtos::{module}::{sub_module}::{mod_name}::{{
    Create{pretty_name}Request, {pretty_name}Query, {pretty_name}Response, Paginated{pretty_name}Response,
    Update{pretty_name}Request,
}};
use crate::dtos::common::reference::MessageResponse;"""
            response_type = f"{pretty_name}Response"
            create_type = f"Create{pretty_name}Request"
            update_type = f"Update{pretty_name}Request"
            query_type = f"{pretty_name}Query"
            paginated_type = f"Paginated{pretty_name}Response"
            
            # GENERATE DTOs
            dto_file_path = os.path.join(dtos_dir, f"{mod_name}.rs")
            
            needs_chrono = any("DateTime" in t or "Date" in t for n, t in fields)
            chrono_import = "use chrono::{NaiveDate, NaiveDateTime};\n" if needs_chrono else ""
            
            dto_content = f"""use serde::{{Deserialize, Serialize}};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
{chrono_import}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct {pretty_name}Query {{
    pub page: Option<u64>,
    pub page_size: Option<u64>,
"""
            if any(n == "name" for n, t in fields):
                dto_content += "    pub name: Option<String>,\n"
            if any(n == "code" for n, t in fields):
                dto_content += "    pub code: Option<String>,\n"
            dto_content += "}\n\n"
            
            dto_content += f"""#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct {pretty_name}Response {{
"""
            for name, type_part in fields:
                dto_type = rust_type_to_dto(type_part)
                dto_content += f"    pub {name}: {dto_type},\n"
            dto_content += "}\n\n"
            
            dto_content += f"""#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct Create{pretty_name}Request {{
"""
            for name, type_part in fields:
                if name in ["id", "created_at", "updated_at", "deleted_at", "sync_at", "created_by", "updated_by"]:
                    continue
                dto_type = rust_type_to_dto(type_part)
                dto_content += f"    pub {name}: {dto_type},\n"
            dto_content += "}\n\n"
            
            dto_content += f"""#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct Update{pretty_name}Request {{
"""
            for name, type_part in fields:
                if name in ["id", "created_at", "updated_at", "deleted_at", "sync_at", "created_by", "updated_by"]:
                    continue
                dto_type = rust_type_to_dto(type_part)
                if not dto_type.startswith("Option<"):
                    dto_type = f"Option<{dto_type}>"
                dto_content += f"    pub {name}: {dto_type},\n"
            dto_content += "}\n\n"
            
            dto_content += f"""#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct Paginated{pretty_name}Response {{
    pub data: Vec<{pretty_name}Response>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}}
"""
            with open(dto_file_path, "w") as f:
                f.write(dto_content)

        # GENERATE CONTROLLER
        ctrl_file_path = os.path.join(controllers_dir, f"{mod_name}.rs")
        
        has_name = any(n == "name" for n, t in fields)
        has_code = any(n == "code" for n, t in fields)
        has_alphabet = any(n == "alphabet_code" for n, t in fields)
        
        order_col = "Name" if has_name else ("Code" if has_code else "Id")
        
        ctrl_content = f"""use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
}};
use uuid::Uuid;
use validator::Validate;

{dto_imports}
use crate::models::{module}::{sub_module}::{mod_name} as entity_mod;

#[endpoint(tags("{module.title()} - {sub_module.title()} - {pretty_name}"), status_codes(200, 500))]
pub async fn list_{mod_name}(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<{paginated_type}>, StatusError> {{
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {{
        StatusError::internal_server_error().brief("Database connection missing")
    }})?;

    let query: {query_type} = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());
"""
        if has_name:
            ctrl_content += """
    if let Some(ref name) = query.name {
        select = select.filter(entity_mod::Column::Name.contains(name));
    }
"""
        if has_code:
            ctrl_content += """
    if let Some(code) = query.code {
        select = select.filter(entity_mod::Column::Code.eq(code));
    }
"""
        
        mapping_code = ""
        for name, type_part in fields:
            if sub_module == "reference" and name not in ["id", "code", "alphabet_code", "name", "created_at", "updated_at", "deleted_at", "sync_at", "created_by", "updated_by"]:
                continue
            
            is_opt = "Option" in type_part
            if name == "code" and sub_module == "reference" and not has_code:
                mapping_code += f"            {name}: 0,\n"
            elif name == "alphabet_code" and sub_module == "reference" and not has_alphabet:
                mapping_code += f"            {name}: String::new(),\n"
            elif name == "name" and sub_module == "reference" and not has_name:
                mapping_code += f"            {name}: String::new(),\n"
            elif name == "deleted_at":
                is_tz = "TimeZone" in type_part
                mapping_code += f"            deleted_at: item.deleted_at.map(|dt| dt{'.naive_utc()' if is_tz else ''}),\n"
            elif name in ["created_at", "updated_at"]:
                if sub_module == "reference":
                    val = f"item.{name}.unwrap_or_else(|| Utc::now().naive_utc())" if is_opt else f"item.{name}"
                else:
                    val = f"item.{name}"
                mapping_code += f"            {name}: {val},\n"
            else:
                if type_part == "String":
                    mapping_code += f"            {name}: item.{name}.clone(),\n"
                else:
                    mapping_code += f"            {name}: item.{name},\n"
                    
        ctrl_content += f"""
    let paginator = select
        .order_by_asc(entity_mod::Column::{order_col})
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| {response_type} {{
{mapping_code}
    }}).collect();

    Ok(Json({paginated_type} {{
        data,
        total,
        page,
        page_size,
        total_pages,
    }}))
}}

#[endpoint(tags("{module.title()} - {sub_module.title()} - {pretty_name}"), status_codes(200, 400, 404, 500))]
pub async fn get_{mod_name[:-1] if mod_name.endswith('s') else mod_name}(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<{response_type}>, StatusError> {{
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {{
        StatusError::internal_server_error().brief("Database connection missing")
    }})?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let item = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("{pretty_name} not found"))?;

    Ok(Json({response_type} {{
{mapping_code}
    }}))
}}

#[endpoint(tags("{module.title()} - {sub_module.title()} - {pretty_name}"), status_codes(200, 400, 500))]
pub async fn create_{mod_name[:-1] if mod_name.endswith('s') else mod_name}(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<{response_type}>, StatusError> {{
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {{
        StatusError::internal_server_error().brief("Database connection missing")
    }})?;

    let payload: {create_type} = req.parse_json().await.map_err(|e| {{
        StatusError::bad_request().brief(format!("Invalid JSON payload: {{}}", e))
    }})?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let now = Utc::now().naive_utc();
    let new_id = Uuid::new_v4();

    let active_model = entity_mod::ActiveModel {{
        id: Set(new_id),
"""
        for name, type_part in fields:
            if name in ["id"]: continue
            if sub_module == "reference" and name not in ["code", "alphabet_code", "name", "created_at", "updated_at", "deleted_at", "sync_at", "created_by", "updated_by"]:
                continue
                
            is_opt = "Option" in type_part
            if name in ["created_at", "updated_at"]:
                ctrl_content += f"        {name}: Set({'Some(now)' if is_opt else 'now'}),\n"
            elif name in ["deleted_at", "sync_at", "created_by", "updated_by"]:
                ctrl_content += f"        {name}: Set(None),\n"
            else:
                ctrl_content += f"        {name}: Set(payload.{name}),\n"
                
        ctrl_content += f"""    }};

    let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json({response_type} {{
{mapping_code}
    }}))
}}

#[endpoint(tags("{module.title()} - {sub_module.title()} - {pretty_name}"), status_codes(200, 400, 404, 500))]
pub async fn update_{mod_name[:-1] if mod_name.endswith('s') else mod_name}(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<{response_type}>, StatusError> {{
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {{
        StatusError::internal_server_error().brief("Database connection missing")
    }})?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let payload: {update_type} = req.parse_json().await.map_err(|e| {{
        StatusError::bad_request().brief(format!("Invalid JSON payload: {{}}", e))
    }})?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("{pretty_name} not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

"""
        for name, type_part in fields:
            if name in ["id", "created_at", "updated_at", "deleted_at", "sync_at", "created_by", "updated_by"]: continue
            if sub_module == "reference" and name not in ["code", "alphabet_code", "name"]:
                continue
                
            is_opt = "Option" in type_part
            val = f"Some({name})" if is_opt else name
            ctrl_content += f"""    if let Some({name}) = payload.{name} {{
        active_model.{name} = Set({val});
    }}\n"""
    
        updated_at_opt = "Option" in dict(fields).get("updated_at", "DateTime")
        
        ctrl_content += f"""    active_model.updated_at = Set({'Some(now)' if updated_at_opt else 'now'});

    let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json({response_type} {{
{mapping_code}
    }}))
}}

#[endpoint(tags("{module.title()} - {sub_module.title()} - {pretty_name}"), status_codes(200, 400, 404, 500))]
pub async fn delete_{mod_name[:-1] if mod_name.endswith('s') else mod_name}(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<MessageResponse>, StatusError> {{
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {{
        StatusError::internal_server_error().brief("Database connection missing")
    }})?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let existing = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("{pretty_name} not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();
"""
        deleted_at_opt = "Option" in dict(fields).get("deleted_at", "Option<DateTime>")
        deleted_at_tz = "TimeZone" in dict(fields).get("deleted_at", "Option<DateTime>")
        
        val = "Utc::now().fixed_offset()" if deleted_at_tz else "now"
        
        ctrl_content += f"""    active_model.deleted_at = Set(Some({val}));
    active_model.updated_at = Set({'Some(now)' if updated_at_opt else 'now'});

    active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {{
        message: "{pretty_name} deleted successfully".to_string(),
    }}))
}}
"""
        with open(ctrl_file_path, "w") as f:
            f.write(ctrl_content)
            
        mod_rs_content_ctrls += f"pub mod {mod_name};\n"
        
        url_path = mod_name.replace("_", "-")
        # Ensure single name for func matches
        func_mod = mod_name[:-1] if mod_name.endswith('s') else mod_name
        
        router_pushes.append(f"""        .push(
            Router::with_path("{url_path}")
                .get({mod_name}::list_{mod_name})
                .post({mod_name}::create_{func_mod})
                .push(
                    Router::with_path("{{id}}")
                        .get({mod_name}::get_{func_mod})
                        .put({mod_name}::update_{func_mod})
                        .delete({mod_name}::delete_{func_mod}),
                ),
        )""")
        
    if sub_module != "reference":
        with open(os.path.join(dtos_dir, "mod.rs"), "w") as f:
            f.write(mod_rs_content_dtos)
            
    mod_rs_content_ctrls += f"\npub fn router() -> Router {{\n    Router::with_path(\"{sub_module.replace('_', '-')}\")\n"
    for rp in router_pushes:
        mod_rs_content_ctrls += rp + "\n"
    mod_rs_content_ctrls += "}\n"
    
    with open(os.path.join(controllers_dir, "mod.rs"), "w") as f:
        f.write(mod_rs_content_ctrls)


if __name__ == "__main__":
    generate_dtos_and_controllers("building", "master")
    generate_dtos_and_controllers("building", "reference")
