import os
import re
from collections import defaultdict

def get_entity_path(filepath):
    # e.g. src/models/feeder/master/dosen.rs -> crate::models::feeder::master::dosen::Entity
    parts = filepath.split('/')
    # remove src and .rs
    module_path = "crate::" + "::".join(parts[1:])[:-3] + "::Entity"
    return module_path

models = {}
for root, _, files in os.walk('src/models/feeder'):
    for file in files:
        if file.endswith('.rs'):
            filepath = os.path.join(root, file)
            models[filepath] = get_entity_path(filepath)

entity_to_filepath = {v: k for k, v in models.items()}

# 1st pass: gather all BelongsTo
belongs_to_map = defaultdict(set) # entity_path -> set of target_entity_paths

for filepath, entity_path in models.items():
    with open(filepath, 'r') as f:
        content = f.read()
    
    # find all BelongsTo<target>
    matches = re.findall(r'BelongsTo<([^>]+)>', content)
    for match in matches:
        # e.g. crate::models::feeder::referensi::agama::Entity
        target = match.strip()
        # remove Option<...> if present
        if target.startswith('Option<'):
            target = target[7:-1]
        belongs_to_map[entity_path].add(target)

# 2nd pass: process files
for filepath, entity_path in models.items():
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    new_lines = []
    i = 0
    seen_targets = set()
    changed = False
    
    while i < len(lines):
        line = lines[i]
        
        # match a field with BelongsTo or HasMany or HasOne
        if i + 2 < len(lines) and '#[serde(skip)]' in lines[i] and '#[sea_orm' in lines[i+1] and ('BelongsTo<' in lines[i+2] or 'HasMany<' in lines[i+2] or 'HasOne<' in lines[i+2]):
            field_decl = lines[i+2]
            
            # extract target entity
            m = re.search(r'(BelongsTo|HasMany|HasOne)<([^>]+)>', field_decl)
            if m:
                rel_type = m.group(1)
                target = m.group(2).strip()
                if target.startswith('Option<'):
                    target = target[7:-1]
                
                # Deduplicate by target entity
                if target in seen_targets:
                    # skip these 3 lines
                    i += 3
                    changed = True
                    continue
                
                # For HasMany, verify reverse BelongsTo exists
                if rel_type == 'HasMany':
                    if entity_path not in belongs_to_map.get(target, set()):
                        # Reverse doesn't exist, remove this HasMany
                        i += 3
                        changed = True
                        continue
                
                seen_targets.add(target)
                
                new_lines.extend(lines[i:i+3])
                i += 3
                continue

        new_lines.append(line)
        i += 1
        
    if changed:
        with open(filepath, 'w') as f:
            f.writelines(new_lines)
        print(f"Fixed {filepath}")

