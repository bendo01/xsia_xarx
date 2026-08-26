# Client Walkthrough & Multi-Role Architecture

The XSIA XARX system implements a high-performance, multi-role academic and institutional management platform built with SolidJS and Rust (Salvo + SeaORM).

---

## 1. System User Roles

The platform provides role-tailored workspaces and access controls:

| Role | Access Level | Description & Capabilities |
| :--- | :--- | :--- |
| **Guests (Users)** | Public Only | Can view public and reference pages; cannot login or self-register. |
| **Administrator** | Full System | Master institutional records, person registries, infrastructure, and RBAC permissions. |
| **Course-Department Admin** | Departmental | Curriculum planning, course offerings, class encounters, lecturer workloads, and thesis reviews. |
| **Students** | Student Portal | Dashboard/Profile, study plan cards (KRS), grades & transcripts (KHS), advisers, and course enrollment. |
| **Lecturer** | Faculty | Teaching activities, class codes, lecture schedules, student grading, and academic advisement. |

### Multi-Role Support & Switching
- A single user account can hold multiple roles simultaneously (e.g. both **Student** and **Lecturer**, or **Administrator** and **Course-Department Admin**).
- Users can switch their active workspace role on-the-fly while logged in through the TopBar account menu or the Dynamic Drawer without losing their session.

---

## 2. Student Role Walkthrough & Workspaces

When a user with the **Student** role logs in (or switches to the Student role), the system automatically routes to:

### 1. Dashboard & Profile Page
- **Route**: [`/student/person/master/individual/show`](file:///home/bendo01/Projects/xsia_xarx/client/src/routes/student/person/master/individual/show.tsx)
- **Features**:
  - Primary student dashboard displaying authenticated student identity (NIM, NIK, NISN, Study Program, Academic Status).
  - Academic summary stats: Cumulative GPA (IPK), Total Credits Taken (SKS), and Registration Status.
  - Quick-action portals to Course Enrollment, Semester Activities, Academic Advisers, and Student Master.
  - Tabbed personal biodata, permanent address, residency, and assigned advisers.

---

### 2. Academic Advisers & Counsellors
- **Route**: [`/student/academic/student/adviser`](file:///home/bendo01/Projects/xsia_xarx/client/src/routes/student/academic/student/adviser/index.tsx)
- **Data Source**: `/api/v1/academic/student/adviser/counsellors` & `/api/v1/academic/student/adviser/decrees`
- **Features**:
  - Displays assigned Academic Advisors (Dosen Pembimbing Akademik / PA) and Thesis Supervisors.
  - Shows lecturer profile, NIDN, official assignment decree number and date, and consultation status.
  - Interactive consultation request modal to submit study plan questions or guidance inquiries directly.

---

### 3. Academic Semester Activities List
- **Route**: [`/student/academic/student/campaign/activity`](file:///home/bendo01/Projects/xsia_xarx/client/src/routes/student/academic/student/campaign/activity/index.tsx)
- **Data Source**: `/api/v1/academic/student/campaign/student-activities`
- **Features**:
  - Complete list of student semester activity campaigns (e.g. 2024/2025 Ganjil, 2023/2024 Genap).
  - Semester KPI metrics: Semester GPA (IPS), Cumulative GPA (IPK), Semester Credits (SKS), and Study Plan Lock Status.
  - Actions to inspect detailed semester KRS/KHS or launch course enrollment.

---

### 4. Academic Detail Activities (Study Plan KRS & Grades KHS)
- **Route**: [`/student/academic/student/campaign/activity/show`](file:///home/bendo01/Projects/xsia_xarx/client/src/routes/student/academic/student/campaign/activity/show.tsx)
- **Data Source**: `/api/v1/academic/student/campaign/student-activities/{id}` & `/api/v1/academic/student/campaign/detail-activities`
- **Features**:
  - Detailed course-by-course breakdown for the selected semester campaign.
  - Displays Course Code, Course Title, SKS Weight, Lecturer, Numeric Mark, Grade Letter (A, B+, etc.), and Grade Point.
  - Study Plan actions: Print Study Card (KRS/KHS) and Drop Course from study plan.

---

### 5. Admitted Students Master Directory
- **Route**: [`/student/academic/student/master`](file:///home/bendo01/Projects/xsia_xarx/client/src/routes/student/academic/student/master/index.tsx)
- **Data Source**: `/api/v1/academic/student/master/students`
- **Features**:
  - Institutional student directory with search by NIM or student name.
  - Columns: Student NIM, Full Name, Study Program, Admission Path (SNBP, SNBT, Mandiri), Admission Date, and Status.
  - Full server pagination controls.

---

### 6. Admitted Student Detail Profile
- **Route**: [`/student/academic/student/master/show`](file:///home/bendo01/Projects/xsia_xarx/client/src/routes/student/academic/student/master/show.tsx)
- **Data Source**: `/api/v1/academic/student/master/students/{id}` & `/api/v1/person/master/individual/{id}`
- **Features**:
  - Comprehensive admission dossier: Registration Number, Selection Path, Curriculum Cohort, Tuition Fees, and Personal Demographics.

---

### 7. Course Enrollment (KRS Gateway)
- **Route**: [`/student/academic/student/campaign/activity/enrollment`](file:///home/bendo01/Projects/xsia_xarx/client/src/routes/student/academic/student/campaign/activity/enrollment.tsx)
- **Data Source**: Teach offerings retrieved from `academic.campaign.transaction.teach` (`/api/v1/academic/campaign/transaction/teaches`) & Enrolled classes from `/api/v1/academic/student/campaign/detail-activities`
- **Features**:
  - Real-time SKS Allowance Calculator with dynamic visual progress bar (Max 24 SKS limit enforcement).
  - Searchable catalog of available class sections with Schedule Day/Time, Room, Lecturer, and Quota/Capacity.
  - One-click "+ Enroll" action with instant credit calculation, capacity check, and backend persistence.
  - "My Selected Study Plan" tray allowing real-time inspection and dropping of selected courses.
