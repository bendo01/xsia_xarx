import os
import re

models_dir = "/home/bendo01/Project/xsia_xarx/server/src/models"

for root, _, files in os.walk(models_dir):
    for file in files:
        if file.endswith(".rs") and file != "mod.rs":
            filepath = os.path.join(root, file)
            with open(filepath, "r") as f:
                content = f.read()
            
            # Find all target entities from has_many, has_one, belongs_to inside #[sea_orm(...)] or just pub <field>: HasMany<...>
            targets = []
            
            # Match: pub field_name: HasMany<TargetEntity>
            matches = re.findall(r'pub \w+: (?:HasMany|HasOne|BelongsTo)<Option<(.+?)>>|pub \w+: (?:HasMany|HasOne|BelongsTo)<(.+?)>', content)
            
            for m in matches:
                target = m[0] if m[0] else m[1]
                # the target might be `crate::models::foo::Entity`
                # extract just the module before ::Entity
                if "::Entity" in target:
                    mod_name = target.split("::")[-2]
                    targets.append(mod_name)
                    
            # check for duplicates
            if len(targets) != len(set(targets)):
                print(f"Duplicate targets in {filepath}: {targets}")
