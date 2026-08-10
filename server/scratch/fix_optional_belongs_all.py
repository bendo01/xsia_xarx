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
            
            # Replace BelongsTo<Option<T>> with BelongsTo<T>
            if "BelongsTo<Option<" in content:
                new_content = re.sub(r'BelongsTo<Option<(.+?)>>', r'BelongsTo<\1>', content)
                with open(filepath, "w") as f:
                    f.write(new_content)
                files_fixed += 1
                print(f"Fixed: {filepath}")

print(f"Total files fixed: {files_fixed}")
