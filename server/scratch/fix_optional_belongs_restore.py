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
            
            # Find all belongs_to relations
            # e.g. #[sea_orm(belongs_to, from = "position_type_id", to = "id")]
            # pub user: BelongsTo<super::user::Entity>,
            
            # We'll parse line by line
            lines = content.split('\n')
            new_lines = []
            
            # First, find which fields are optional
            # e.g. pub position_type_id: Option<Uuid>,
            optional_fields = set()
            for line in lines:
                match = re.search(r'pub\s+([a-zA-Z0-9_]+)\s*:\s*Option<', line)
                if match:
                    optional_fields.add(match.group(1))
            
            changed = False
            for i, line in enumerate(lines):
                if '#[sea_orm(belongs_to' in line:
                    match = re.search(r'from\s*=\s*"([^"]+)"', line)
                    if match:
                        from_field = match.group(1)
                        if from_field in optional_fields:
                            # The next line should be the BelongsTo
                            if i + 1 < len(lines):
                                next_line = lines[i+1]
                                if "BelongsTo<" in next_line and "Option<" not in next_line:
                                    # Replace BelongsTo<...::Entity> with BelongsTo<Option<...::Entity>>
                                    new_next_line = re.sub(r'BelongsTo<(.+?)>', r'BelongsTo<Option<\1>>', next_line)
                                    lines[i+1] = new_next_line
                                    changed = True
            
            if changed:
                with open(filepath, "w") as f:
                    f.write('\n'.join(lines))
                files_fixed += 1
                print(f"Fixed: {filepath}")

print(f"Total files fixed: {files_fixed}")
