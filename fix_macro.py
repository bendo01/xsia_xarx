import re

with open('server/src/controllers/person/reference/mod.rs', 'r') as f:
    content = f.read()

# The script previously messed up the braces of the macro. Let's extract from git or just fix it.
# Actually, it's easier to just reset the file from git and run a correct script.
