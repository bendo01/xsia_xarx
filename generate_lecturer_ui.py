import re
import os

with open('client/src/routes/course-department/academic/student/master/student/index.tsx', 'r') as f:
    content = f.read()

# Replace imports
content = re.sub(
    r"import \{.*?\} from '~/controllers/academic/student/master/AcademicStudentMasterStudentController';",
    r"import { masterApiList } from '~/controllers/master/masterApiController';\nimport { listStudyUnits } from '~/controllers/academic/student/master/AcademicStudentMasterStudentController';",
    content,
    flags=re.DOTALL
)

# Rename Component
content = content.replace("CourseDepartmentStudentMasterPage", "CourseDepartmentLecturerMasterPage")

# Replace listStudents with a custom fetch implementation
# Actually, since we'll just rewrite the fetchStudents function, let's do a few simple replacements
content = content.replace("students", "lecturers")
content = content.replace("setStudents", "setLecturers")
content = content.replace("students()", "lecturers()")
content = content.replace("StudentMasterItem", "any")

content = content.replace("Student", "Lecturer")
content = content.replace("student", "lecturer")

content = content.replace("NIM", "NIDN")
content = content.replace("NIM / Code", "NIDN / Code")

# Modify fetchLecturers (formerly fetchStudents)
fetch_func_pattern = re.compile(r"const fetchLecturers = async \(\) => \{.*?\};\n\n", re.DOTALL)
fetch_replacement = """const fetchLecturers = async () => {
        const currentUnitId = selectedUnitId();
        const currentInstId = (searchParams.institution_id as string) || (activeUnitData()?.institution_id as string) || '';

        if (!currentUnitId && !currentInstId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const isAllUnits = currentUnitId === 'all';
            const [sortField, sortDir] = sortParam().split('-');
            const res = await masterApiList('academic/lecturer/transaction/homebases', {
                page: page(),
                page_size: pageSize(),
                unit_id: (!isAllUnits && currentUnitId) ? currentUnitId : undefined,
                institution_id: (isAllUnits && currentInstId) ? currentInstId : ((searchParams.institution_id as string) || undefined),
                search: searchName().trim() || searchCode().trim() || undefined,
                status_id: selectedStatusId() || undefined,
                sort_by: sortField || 'id',
                sort_dir: sortDir || 'asc',
            });

            setLecturers(res.data || []);
            setTotalPages(res.total_pages || 1);
            setTotalItems(res.total ?? (res.data ? res.data.length : 0));
        } catch (err) {
            console.error('Error fetching lecturers:', err);
            toast.danger('Failed to load lecturers for this department.');
            setLecturers([]);
            setTotalPages(1);
            setTotalItems(0);
        } finally {
            setIsLoading(false);
        }
    };

"""

content = fetch_func_pattern.sub(fetch_replacement, content)

# Remove academic year stuff
content = re.sub(r"const \[academicYears, setAcademicYears\].*?;", "", content)
content = re.sub(r"const \[unitAcademicYears, setUnitAcademicYears\].*?;", "", content)
content = re.sub(r"const \[selectedAcademicYearId, setSelectedAcademicYearId\].*?;", "", content)

# Remove unit academic year logic
content = re.sub(r"const loadUnitAcademicYears.*?};", "", content, flags=re.DOTALL)

# In loadReferences
content = re.sub(r"const \[uList, yList, sList\] = await Promise\.all\(\[.*?\]\);", 
"""const [uList, sList] = await Promise.all([
                listStudyUnits(),
                masterApiList('common/reference/references', { group: 'LecturerStatus' }).then(r => r.data || []),
            ]);""", content, flags=re.DOTALL)

content = content.replace("setAcademicYears(yList);", "")
content = content.replace("await loadUnitAcademicYears(resolvedUnit);", "")
content = content.replace("await loadUnitAcademicYears(unitId);", "")
content = content.replace("setSelectedAcademicYearId('');", "")

content = content.replace("std.academic_year_name || '-'", "std.lecturer?.group_name || '-'")
content = content.replace("std.selection_type_name || '-'", "std.contract_name || '-'")
content = content.replace("Admission Path", "Contract Type")
content = content.replace("Academic Year", "Lecturer Group")
content = content.replace("std.registered", "std.lecturer?.rank_name")
content = content.replace("Registered Date", "Academic Rank")
content = content.replace("Registered", "Academic Rank")
content = content.replace("std.code", "std.lecturer?.code || '-'")
content = content.replace("std.name", "std.lecturer_name || '-'")

with open('client/src/routes/course-department/academic/lecturer/master/lecturer/index.tsx', 'w') as f:
    f.write(content)

print("done")
