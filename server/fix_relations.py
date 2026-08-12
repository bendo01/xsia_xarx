import os
import re

def fix_file(filepath, struct_name, to_entity_str, from_col, to_col, condition_type, rev=False):
    with open(filepath, 'r') as f:
        content = f.read()

    # Find the block inside link(&self) -> Vec<RelationDef> { ... }
    # We will just replace the whole link function
    
    rev_str = ".rev()" if rev else ""
    
    new_link = f"""
    fn link(&self) -> Vec<sea_orm::RelationDef> {{
        let rel: sea_orm::RelationDef = {to_entity_str}::belongs_to(Self::FromEntity)
            .from({from_col})
            .to({to_col})
            .on_condition(|_left, _right| {{
                {from_col.replace("ArchiveableId", "ArchiveableType")}.eq("{condition_type}").into()
            }})
            .into();
        vec![rel{rev_str}]
    }}
"""
    # Let's just do a simpler regex replacement
    # We'll just replace the whole `vec![ ... ]` block.
    pass

# actually, it's easier to just use sed or perl
