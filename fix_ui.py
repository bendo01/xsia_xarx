import re

with open('client/src/routes/course-department/academic/lecturer/master/lecturer/index.tsx', 'r') as f:
    content = f.read()

# Remove the "Academic Cohorts" block
content = re.sub(
    r'<div class="bg-white dark:bg-neutral-800 rounded-xs p-4 border border-neutral-200/70 dark:border-neutral-700 shadow-2xs flex items-center justify-between">\s*<div class="space-y-0\.5">\s*<span class="text-\[11px\] font-mono font-medium text-neutral-400 uppercase tracking-wider">Academic Cohorts</span>.*?</div>\s*</div>',
    '',
    content,
    flags=re.DOTALL
)

# Remove the "Filter by Academic Year" block
content = re.sub(
    r'<!-- Filter by Academic Year -->.*?</div>\s*</div>\s*<!-- Filter by Status -->',
    '<!-- Filter by Status -->',
    content,
    flags=re.DOTALL
)
# Just to be sure, in case the comment was replaced
content = re.sub(
    r'<div class="space-y-1">\s*<label class="text-\[11px\] font-mono font-semibold text-neutral-500 uppercase">\s*Lecturer Group\s*</label>\s*<select\s*value=\{selectedAcademicYearId\(\)\}.*?</select>\s*</div>',
    '',
    content,
    flags=re.DOTALL
)

# Replace remaining unitAcademicYears references (if any exist in other places)
content = re.sub(r'\{unitAcademicYears\(\)\.length\}', '0', content)
content = re.sub(r'<For each=\{unitAcademicYears\(\)\}>.*?</For>', '', content, flags=re.DOTALL)
content = content.replace("selectedAcademicYearId() ||", "")

# In the hasActiveFilters use of selectedAcademicYearId()
content = content.replace("selectedAcademicYearId() ||", "")

with open('client/src/routes/course-department/academic/lecturer/master/lecturer/index.tsx', 'w') as f:
    f.write(content)
