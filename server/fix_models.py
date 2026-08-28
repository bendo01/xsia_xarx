import os
import re
import glob

def process_file(filepath):
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    new_lines = []
    i = 0
    changed = False
    
    while i < len(lines):
        line = lines[i]
        
        # Check for _rel field
        if i + 2 < len(lines) and '#[serde(skip)]' in lines[i] and '#[sea_orm' in lines[i+1] and '_rel:' in lines[i+2]:
            i += 3
            changed = True
            continue
            
        new_lines.append(line)
        i += 1
        
    # Also fix missing NullableUuid
    content = "".join(new_lines)
    
    # Check if NullableUuid is used but not defined
    if 'NullableUuid' in content and 'pub type NullableUuid' not in content:
        # Add pub type NullableUuid = Option<Uuid>; after use sea_orm::entity::prelude::*;
        content = re.sub(r'(use sea_orm::entity::prelude::\*;\n)', r'\1\npub type NullableUuid = Option<Uuid>;\n', content)
        changed = True
        
    # Check if serde attributes are used but use serde... is not imported
    if '#[serde' in content and 'use serde::{Deserialize, Serialize}' not in content:
        content = re.sub(r'(use sea_orm::entity::prelude::\*;\n)', r'\1use serde::{Deserialize, Serialize};\n', content)
        # Also need to add Serialize, Deserialize to derive if not there
        content = re.sub(r'#\[derive\(([^)]+)\)\]', lambda m: f"#[derive({m.group(1)}, Serialize, Deserialize)]" if 'Serialize' not in m.group(1) else m.group(0), content)
        changed = True

    if changed:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Fixed {filepath}")

for root, _, files in os.walk('src/models/feeder'):
    for file in files:
        if file.endswith('.rs'):
            process_file(os.path.join(root, file))

