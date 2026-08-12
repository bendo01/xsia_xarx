import os
import glob
import re

def to_snake_case(name):
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

def get_rust_files(directory):
    files = []
    for root, _, filenames in os.walk(directory):
        for filename in filenames:
            if filename.endswith(".rs") and filename != "mod.rs":
                files.append(os.path.join(root, filename))
    return files

def has_entity(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        if "pub struct Model" in content and "Entity" in content:
            return True
        if "ActiveModel" in content and "Entity" in content:
            return True
    return False

def generate_controller_tests():
    controller_dir = "src/controllers"
    if not os.path.exists(controller_dir):
        return

    top_level_modules = [d for d in os.listdir(controller_dir) if os.path.isdir(os.path.join(controller_dir, d))]

    if not os.path.exists("tests"):
        os.makedirs("tests")

    for module in top_level_modules:
        test_file_path = f"tests/generated_{module}_controllers_test.rs"
        module_path = os.path.join(controller_dir, module)
        
        endpoints = []
        for file in get_rust_files(module_path):
            rel_path = os.path.relpath(file, controller_dir)
            route = "/" + rel_path[:-3].replace("\\", "/").replace("_", "-")
            endpoints.append(route)
            
        if not endpoints:
            continue
            
        with open(test_file_path, "w", encoding="utf-8") as f:
            f.write("use salvo::prelude::*;\n")
            f.write("use salvo::test::*;\n")
            f.write("use xsia_xarx::controllers;\n")
            f.write("use xsia_xarx::db::connect_db;\n\n")
            
            f.write("#[handler]\n")
            f.write("async fn inject_db(depot: &mut Depot) {\n")
            f.write("    let db = connect_db().await.expect(\"Failed to connect to DB\");\n")
            f.write("    depot.insert_typed(db);\n")
            f.write("}\n\n")
            
            f.write(f"#[tokio::test]\n")
            f.write(f"async fn test_{module}_controllers() {{\n")
            f.write(f"    let router = controllers::{module}::router();\n")
            f.write(f"    let service = Service::new(router).hoop(inject_db);\n\n")
            
            f.write("    let paths = vec![\n")
            for endpoint in endpoints:
                rel_path = endpoint[len(f"/{module}"):]
                if not rel_path.startswith("/"):
                    rel_path = "/" + rel_path
                f.write(f'        "{rel_path}",\n')
            f.write("    ];\n\n")
            
            f.write("    for path in paths {\n")
            f.write("        let url = format!(\"http://127.0.0.1:5800{}\", path);\n")
            f.write("        let res = TestClient::get(&url).send(&service).await;\n")
            f.write("        assert!(res.status_code.is_some(), \"Failed to reach {}\", path);\n")
            f.write("    }\n")
            f.write("}\n")

def generate_model_tests():
    model_dir = "src/models"
    if not os.path.exists(model_dir):
        return

    top_level_modules = [d for d in os.listdir(model_dir) if os.path.isdir(os.path.join(model_dir, d))]

    for module in top_level_modules:
        test_file_path = f"tests/generated_{module}_models_test.rs"
        module_path = os.path.join(model_dir, module)
        
        models_to_test = []
        for file in get_rust_files(module_path):
            if os.path.basename(file) == "prelude.rs":
                continue
            if not has_entity(file):
                continue
                
            rel_path = os.path.relpath(file, model_dir)
            mod_path = rel_path[:-3].replace("\\", "/").replace("/", "::")
            models_to_test.append(mod_path)
            
        if not models_to_test:
            continue
            
        with open(test_file_path, "w", encoding="utf-8") as f:
            f.write("use sea_orm::*;\n")
            f.write("use xsia_xarx::db::connect_db;\n")
            f.write("use xsia_xarx::models;\n\n")
            
            f.write(f"#[tokio::test]\n")
            f.write(f"async fn test_{module}_models_query() {{\n")
            f.write("    let db = connect_db().await.expect(\"Failed to connect to the database\");\n\n")
            
            for mod_path in models_to_test:
                f.write(f"    // Test query for {mod_path}\n")
                f.write(f"    let result = models::{mod_path}::Entity::find().one(&db).await;\n")
                f.write(f"    assert!(result.is_ok(), \"Query failed for {mod_path}\");\n\n")
            
            f.write("}\n")

if __name__ == "__main__":
    generate_controller_tests()
    generate_model_tests()
    print("Tests generated successfully in tests/ directory.")
