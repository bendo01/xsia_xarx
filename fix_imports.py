import re

with open('client/src/routes/course-department/academic/student/master/student/index.tsx', 'r') as f:
    student_content = f.read()
    
# get the imports block from student_content (first 25 lines)
imports_block = "\n".join(student_content.split("\n")[:25])

# modify the imports block for lecturer
imports_block = imports_block.replace(
    "import {\n    listStudents,\n    listStudyUnits,\n    listAcademicYears,\n    listStudentStatuses,\n    listStudentAcademicYears,\n    StudentMasterItem\n} from '~/controllers/academic/student/master/AcademicStudentMasterStudentController';",
    "import { masterApiList } from '~/controllers/master/masterApiController';\nimport { listStudyUnits } from '~/controllers/academic/student/master/AcademicStudentMasterStudentController';"
)

with open('client/src/routes/course-department/academic/lecturer/master/lecturer/index.tsx', 'r') as f:
    content = f.read()
    
# replace the broken imports
content = imports_block + "\n" + content[content.find("export default function"):]

with open('client/src/routes/course-department/academic/lecturer/master/lecturer/index.tsx', 'w') as f:
    f.write(content)
