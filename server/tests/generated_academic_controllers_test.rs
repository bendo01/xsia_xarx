use salvo::prelude::*;
use salvo::test::*;
use xsia_xarx::controllers;
use xsia_xarx::db::connect_db;

#[handler]
async fn inject_db(depot: &mut Depot) {
    let db = connect_db().await.expect("Failed to connect to DB");
    depot.insert_typed(db);
}

#[tokio::test]
async fn test_academic_controllers() {
    let router = controllers::academic::router();
    let service = Service::new(router).hoop(inject_db);

    let paths = vec![
        "/campaign/reference/attend-types",
        "/campaign/reference/calendar-categories",
        "/campaign/reference/encounter-categories",
        "/campaign/reference/implementations",
        "/campaign/reference/scopes",
        "/campaign/reference/substances",
        "/campaign/transaction/activities",
        "/campaign/transaction/calendar-details",
        "/campaign/transaction/calendars",
        "/campaign/transaction/class-codes",
        "/campaign/transaction/grades",
        "/campaign/transaction/schedules",
        "/campaign/transaction/teach-decrees",
        "/campaign/transaction/teach-evaluations",
        "/campaign/transaction/teach-lecturers",
        "/campaign/transaction/teaches",
        "/candidate/master/candidate-unit",
        "/candidate/master/candidates",
        "/candidate/master/exam-classes",
        "/candidate/reference/document-types",
        "/candidate/reference/phases",
        "/candidate/reference/registration-categories",
        "/candidate/reference/registration-types",
        "/candidate/transaction/candidate-unit-choices",
        "/candidate/transaction/documents",
        "/candidate/transaction/exams",
        "/course/master/concentrations",
        "/course/master/course-evaluation-plannings",
        "/course/master/course-learn-plannings",
        "/course/master/courses",
        "/course/master/curriculum-details",
        "/course/master/curriculums",
        "/course/reference/competences",
        "/course/reference/course-evaluation-bases",
        "/course/reference/curriculum-types",
        "/course/reference/encounter-types",
        "/course/reference/evaluation-types",
        "/course/reference/groups",
        "/course/reference/semesters",
        "/course/reference/varieties",
        "/general/reference/academic-year-categories",
        "/general/reference/academic-years",
        "/lecturer/master/lecturers",
        "/lecturer/reference/contracts",
        "/lecturer/reference/groups",
        "/lecturer/reference/ranks",
        "/lecturer/reference/statuses",
        "/lecturer/transaction/academic-groups",
        "/lecturer/transaction/academic-ranks",
        "/lecturer/transaction/homebases",
        "/prior-learning-recognition/reference/evaluator-types",
        "/prior-learning-recognition/reference/evidence-categories",
        "/prior-learning-recognition/reference/evidence-types",
        "/prior-learning-recognition/reference/professionalisms",
        "/prior-learning-recognition/transaction/decrees",
        "/prior-learning-recognition/transaction/evaluation-details",
        "/prior-learning-recognition/transaction/evaluations",
        "/prior-learning-recognition/transaction/evaluators",
        "/prior-learning-recognition/transaction/recognitions",
        "/student/adviser/counsellors",
        "/student/adviser/decrees",
        "/student/campaign/convertions",
        "/student/campaign/detail-activities",
        "/student/campaign/detail-activity-evaluation-components",
        "/student/campaign/student-activities",
        "/student/final-assignment/reference/adviser-categories",
        "/student/final-assignment/reference/approval-types",
        "/student/final-assignment/reference/categories",
        "/student/final-assignment/reference/requirements",
        "/student/final-assignment/reference/stages",
        "/student/final-assignment/reference/varieties",
        "/student/final-assignment/transaction/advisers",
        "/student/final-assignment/transaction/evaluation-details",
        "/student/final-assignment/transaction/evaluation-summaries",
        "/student/final-assignment/transaction/final-assignment-decrees",
        "/student/final-assignment/transaction/prerequisites",
        "/student/final-assignment/transaction/schedules",
        "/student/final-assignment/transaction/submissions",
        "/student/master/images",
        "/student/master/students",
        "/student/reference/finances",
        "/student/reference/registrations",
        "/student/reference/resign-statuses",
        "/student/reference/selection-types",
        "/student/reference/statuses",
        "/survey/master/answers",
        "/survey/master/bundle-question",
        "/survey/master/bundles",
        "/survey/master/questions",
        "/survey/reference/bundle-categories",
        "/survey/reference/question-varieties",
        "/survey/transaction/conducts",
        "/survey/transaction/responds",
    ];

    for path in paths {
        let url = format!("http://127.0.0.1:5800{}", path);
        let res = TestClient::get(&url).send(&service).await;
        assert!(res.status_code.is_some(), "Failed to reach {}", path);
    }
}
