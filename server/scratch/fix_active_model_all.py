import os
import re

models_dir = "/home/bendo01/Project/xsia_xarx/server/src/models"

files_fixed = 0

for root, _, files in os.walk(models_dir):
    for file in files:
        if file.endswith(".rs") and file != "mod.rs":
            filepath = os.path.join(root, file)
            with open(filepath, "r") as f:
                content = f.read()
            
            # Check if it has a struct Model
            if "pub struct Model" in content and "impl ActiveModelBehavior for ActiveModel" not in content:
                # Add the implementation at the end of the file
                with open(filepath, "a") as f:
                    f.write("\n\nimpl ActiveModelBehavior for ActiveModel {}\n")
                files_fixed += 1
                print(f"Fixed: {filepath}")

print(f"Total files fixed: {files_fixed}")
