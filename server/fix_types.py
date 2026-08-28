import os
import re

types = """pub type NullableUuid = Option<Uuid>;
pub type NullableString = Option<String>;
pub type NullableI32 = Option<i32>;
pub type NullableF32 = Option<f32>;
pub type NullableDateTime = Option<DateTime>;"""

for root, _, files in os.walk('src/models/feeder'):
    for file in files:
        if file.endswith('.rs'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            changed = False
            for t in ["NullableUuid", "NullableString", "NullableI32", "NullableF32", "NullableDateTime"]:
                if t in content and f"pub type {t}" not in content:
                    content = re.sub(
                        r'(use sea_orm::entity::prelude::\*;\n)',
                        f'\\1pub type {t} = Option<{t[8:] if t != "NullableString" else "String"}>;\n',
                        content
                    )
                    changed = True
            
            # fix type generation mapping manually
            content = content.replace("Option<Uuid>", "Option<Uuid>")
            content = content.replace("Option<String>", "Option<String>")
            content = content.replace("Option<I32>", "Option<i32>")
            content = content.replace("Option<F32>", "Option<f32>")
            content = content.replace("Option<DateTime>", "Option<DateTime>")

            if changed:
                with open(filepath, 'w') as f:
                    f.write(content)
                print(f"Fixed types in {filepath}")

