import re

with open('client/src/routes/course-department/academic/student/master/student/index.tsx', 'r') as f:
    code = f.read()

# Make a simplified version based on this template, substituting student for lecturer
# Wait, parsing 950 lines of complex UI is better done by just generating the new code directly via LLM output,
# but it's 950 lines long.
