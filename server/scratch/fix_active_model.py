import os

models_dir = "/home/bendo01/Project/xsia_xarx/server/src/models"

for root, _, files in os.walk(models_dir):
    for file in files:
        if file.endswith(".rs") and file != "mod.rs":
            filepath = os.path.join(root, file)
            with open(filepath, "r") as f:
                content = f.read()
            
            if "#[sea_orm::model]" in content or "DeriveEntityModel" in content:
                if "impl ActiveModelBehavior for ActiveModel {}" not in content:
                    with open(filepath, "a") as f:
                        f.write("\nimpl ActiveModelBehavior for ActiveModel {}\n")
                    print(f"Added ActiveModelBehavior to {filepath}")
