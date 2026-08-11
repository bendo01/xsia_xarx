import os

def to_pascal_case(snake_str):
    if snake_str.endswith("es") and snake_str != "staffes":
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
                    if 'BelongsTo' in line or 'HasMany' in line or 'HasOne' in line or 'ManyTo' in line:
                        continue
                    parts = line.replace('pub ', '').split(':')
                    name = parts[0].strip()
                    type_part = parts[1].split(',')[0].strip()
                    fields.append((name, type_part))
    return fields

def process_directory(base_mod_path, tag_prefix):
    models_dir = f"/home/bendo01/Project/xsia_xarx/server/src/models/{base_mod_path}"
    controllers_dir = f"/home/bendo01/Project/xsia_xarx/server/src/controllers/{base_mod_path}"
    
    os.makedirs(controllers_dir, exist_ok=True)
    
    # get all models
    models = []
    for f in os.listdir(models_dir):
        if f.endswith(".rs") and f not in ["mod.rs", "prelude.rs"]:
            mod_name = f[:-3]
            # check if it uses the macro in the controller
            ctrl_path = os.path.join(controllers_dir, f)
            if os.path.exists(ctrl_path):
                with open(ctrl_path, 'r') as cf:
                    if 'impl_reference_controller!' in cf.read():
                        models.append(mod_name)
            
    models.sort()
    
    for mod_name in models:
        file_path = os.path.join(controllers_dir, f"{mod_name}.rs")
        model_path = os.path.join(models_dir, f"{mod_name}.rs")
        
        fields_dict = dict(parse_model(model_path))
        
        created_at_type = fields_dict.get("created_at", "DateTime")
        updated_at_type = fields_dict.get("updated_at", "DateTime")
        deleted_at_type = fields_dict.get("deleted_at", "Option<DateTime>")
        
        created_at_is_opt = "Option" in created_at_type
        updated_at_is_opt = "Option" in updated_at_type
        
        created_at_set = "Set(Some(now))" if created_at_is_opt else "Set(now)"
        updated_at_set = "Set(Some(now))" if updated_at_is_opt else "Set(now)"
        
        created_at_val = "item.created_at.unwrap_or_else(|| Utc::now().naive_utc())" if created_at_is_opt else "item.created_at"
        updated_at_val = "item.updated_at.unwrap_or_else(|| Utc::now().naive_utc())" if updated_at_is_opt else "item.updated_at"
        
        is_timezone = "TimeZone" in deleted_at_type
        
        pretty_name = to_pascal_case(mod_name)
        plural_name = mod_name
        if not plural_name.endswith("s") and not plural_name.endswith("status"):
            plural_name += "s"
        elif plural_name.endswith("status"):
            plural_name += "es"
            
        has_code = "code" in fields_dict
        has_alphabet = "alphabet_code" in fields_dict
        has_name = "name" in fields_dict
        
        order_col = "Name" if has_name else "Id"
        if has_code and not has_name:
            order_col = "Code"
            
        content = f"""use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
}};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::common::reference::{{
    CreateReferenceRequest, MessageResponse, PaginatedReferenceResponse, ReferenceQuery,
    ReferenceResponse, UpdateReferenceRequest,
}};
use crate::models::{base_mod_path.replace("/", "::")}::{mod_name} as entity_mod;

#[endpoint(tags("{tag_prefix} - {pretty_name}"), status_codes(200, 500))]
pub async fn list_{plural_name}(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedReferenceResponse>, StatusError> {{
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {{
        StatusError::internal_server_error().brief("Database connection missing")
    }})?;

    let query: ReferenceQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select =
        entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());
"""
        if has_name:
            content += """
    if let Some(ref name) = query.name {
        select = select.filter(entity_mod::Column::Name.contains(name));
    }
"""
        if has_code:
            content += """
    if let Some(code) = query.code {
        select = select.filter(entity_mod::Column::Code.eq(code));
    }
"""
        content += f"""
    let paginator = select
        .order_by_asc(entity_mod::Column::{order_col})
        .paginate(db, page_size);

    let total = paginator
        .num_items()
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator
        .fetch_page(page.saturating_sub(1))
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items
        .into_iter()
        .map(|item| ReferenceResponse {{
            id: item.id,
            code: {"item.code" if has_code else "0"}, 
            alphabet_code: {"item.alphabet_code.clone()" if has_alphabet else 'String::new()'},
            name: {"item.name.clone()" if has_name else 'String::new()'},
            created_at: {created_at_val},
            updated_at: {updated_at_val},
            deleted_at: item.deleted_at.map(|dt| dt{".naive_utc()" if is_timezone else ""}),
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
        }})
        .collect();

    Ok(Json(PaginatedReferenceResponse {{
        data,
        total,
        page,
        page_size,
        total_pages,
    }}))
}}

#[endpoint(tags("{tag_prefix} - {pretty_name}"), status_codes(200, 400, 404, 500))]
pub async fn get_{mod_name}(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<ReferenceResponse>, StatusError> {{
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {{
        StatusError::internal_server_error().brief("Database connection missing")
    }})?;

    let id_str = req
        .param::<String>("id")
        .ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;

    let id = Uuid::parse_str(&id_str)
        .map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let item = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| {{
            StatusError::not_found().brief(format!("{pretty_name} not found"))
        }})?;

    Ok(Json(ReferenceResponse {{
        id: item.id,
        code: {"item.code" if has_code else "0"},
        alphabet_code: {"item.alphabet_code" if has_alphabet else 'String::new()'},
        name: {"item.name" if has_name else 'String::new()'},
        created_at: {created_at_val},
        updated_at: {updated_at_val},
        deleted_at: item.deleted_at.map(|dt| dt{".naive_utc()" if is_timezone else ""}),
        sync_at: item.sync_at,
        created_by: item.created_by,
        updated_by: item.updated_by,
    }}))
}}

#[endpoint(tags("{tag_prefix} - {pretty_name}"), status_codes(200, 400, 500))]
pub async fn create_{mod_name}(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<ReferenceResponse>, StatusError> {{
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {{
        StatusError::internal_server_error().brief("Database connection missing")
    }})?;

    let payload: CreateReferenceRequest = req.parse_json().await.map_err(|e| {{
        StatusError::bad_request().brief(format!("Invalid JSON payload: {{}}", e))
    }})?;

    payload
        .validate()
        .map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let now = Utc::now().naive_utc();
    let new_id = Uuid::new_v4();

    let active_model = entity_mod::ActiveModel {{
        id: Set(new_id),
"""
        if has_code:
            content += "        code: Set(payload.code),\n"
        if has_alphabet:
            content += "        alphabet_code: Set(payload.alphabet_code),\n"
        if has_name:
            content += "        name: Set(payload.name),\n"
            
        content += f"""        created_at: {created_at_set},
        updated_at: {updated_at_set},
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    }};

    let item = active_model
        .insert(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(ReferenceResponse {{
        id: item.id,
        code: {"item.code" if has_code else "0"},
        alphabet_code: {"item.alphabet_code" if has_alphabet else 'String::new()'},
        name: {"item.name" if has_name else 'String::new()'},
        created_at: {created_at_val},
        updated_at: {updated_at_val},
        deleted_at: item.deleted_at.map(|dt| dt{".naive_utc()" if is_timezone else ""}),
        sync_at: item.sync_at,
        created_by: item.created_by,
        updated_by: item.updated_by,
    }}))
}}

#[endpoint(tags("{tag_prefix} - {pretty_name}"), status_codes(200, 400, 404, 500))]
pub async fn update_{mod_name}(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<ReferenceResponse>, StatusError> {{
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {{
        StatusError::internal_server_error().brief("Database connection missing")
    }})?;

    let id_str = req
        .param::<String>("id")
        .ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;

    let id = Uuid::parse_str(&id_str)
        .map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let payload: UpdateReferenceRequest = req.parse_json().await.map_err(|e| {{
        StatusError::bad_request().brief(format!("Invalid JSON payload: {{}}", e))
    }})?;

    payload
        .validate()
        .map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| {{
            StatusError::not_found().brief(format!("{pretty_name} not found"))
        }})?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();
"""
        if has_code:
            content += """
    if let Some(code) = payload.code {
        active_model.code = Set(code);
    }
"""
        if has_alphabet:
            content += """
    if let Some(alphabet_code) = payload.alphabet_code {
        active_model.alphabet_code = Set(alphabet_code);
    }
"""
        if has_name:
            content += """
    if let Some(name) = payload.name {
        active_model.name = Set(name);
    }
"""

        content += f"""    active_model.updated_at = {updated_at_set};

    let item = active_model
        .update(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(ReferenceResponse {{
        id: item.id,
        code: {"item.code" if has_code else "0"},
        alphabet_code: {"item.alphabet_code" if has_alphabet else 'String::new()'},
        name: {"item.name" if has_name else 'String::new()'},
        created_at: {created_at_val},
        updated_at: {updated_at_val},
        deleted_at: item.deleted_at.map(|dt| dt{".naive_utc()" if is_timezone else ""}),
        sync_at: item.sync_at,
        created_by: item.created_by,
        updated_by: item.updated_by,
    }}))
}}

#[endpoint(tags("{tag_prefix} - {pretty_name}"), status_codes(200, 400, 404, 500))]
pub async fn delete_{mod_name}(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<MessageResponse>, StatusError> {{
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {{
        StatusError::internal_server_error().brief("Database connection missing")
    }})?;

    let id_str = req
        .param::<String>("id")
        .ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;

    let id = Uuid::parse_str(&id_str)
        .map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let existing = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| {{
            StatusError::not_found().brief(format!("{pretty_name} not found"))
        }})?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();
    active_model.deleted_at = Set(Some(Utc::now(){".fixed_offset()" if is_timezone else ".naive_utc()"}) );
    active_model.updated_at = {updated_at_set};

    active_model
        .update(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {{
        message: format!("{pretty_name} deleted successfully"),
    }}))
}}
"""
        with open(file_path, "w") as f:
            f.write(content)

if __name__ == "__main__":
    process_directory("literate", "Literate")
    process_directory("person/reference", "Person Reference")
