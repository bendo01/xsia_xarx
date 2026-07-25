import re

with open('server/src/controllers/person/reference/mod.rs', 'r') as f:
    content = f.read()

# Extract macro definition
macro_start = content.find('macro_rules! impl_reference_controller')
macro_end = content.find('}\n\n\nimpl_reference_controller!', macro_start) + 1
macro_body = content[macro_start:macro_end]

# Modify macro to remove pub mod $mod_name { ... }
macro_body = macro_body.replace('pub mod $mod_name {', '')
# Remove the first parameter
macro_body = macro_body.replace('$mod_name:ident,\n', '')

# Remove the closing brace of the mod
macro_body = macro_body.replace('        }\n    };\n}', '    };\n}')

# Now the macro is updated. Let's add #[macro_export] at the top
macro_body = '#[macro_export]\n' + macro_body

# Extract invocations
invocations = re.findall(r'impl_reference_controller!\((.*?)\);', content, re.DOTALL)

for inv in invocations:
    # First arg is mod_name
    parts = [p.strip() for p in inv.split(',')]
    mod_name = parts[0]
    
    # Remove mod_name from invocation
    new_inv = 'crate::impl_reference_controller!(\n    ' + ',\n    '.join(parts[1:]) + '\n);\n'
    
    filepath = f'server/src/controllers/person/reference/{mod_name}.rs'
    with open(filepath, 'w') as out_f:
        out_f.write(new_inv)

# Generate new mod.rs
new_mod_rs = """use salvo::oapi::swagger_ui::SwaggerUi;
use salvo::oapi::OpenApi;
use salvo::prelude::*;

pub mod dto;
"""

for inv in invocations:
    mod_name = [p.strip() for p in inv.split(',')][0]
    new_mod_rs += f"pub mod {mod_name};\n"

new_mod_rs += "\n" + macro_body + "\n\n"

# Extract router
router_start = content.find('pub fn router() -> Router {')
router_code = content[router_start:]

new_mod_rs += router_code

with open('server/src/controllers/person/reference/mod.rs', 'w') as f:
    f.write(new_mod_rs)

print("Done splitting reference models.")
