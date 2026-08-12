use sea_orm::*;
use xsia_xarx::db::connect_db;
use xsia_xarx::models;

#[tokio::test]
async fn test_academic_models_query() {
    let db = connect_db().await.expect("Failed to connect to the database");

    // Test query for academic::campaign::reference::attend_types
    let result = models::academic::campaign::reference::attend_types::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::campaign::reference::attend_types");

    // Test query for academic::campaign::reference::calendar_categories
    let result = models::academic::campaign::reference::calendar_categories::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::campaign::reference::calendar_categories");

    // Test query for academic::campaign::reference::encounter_categories
    let result = models::academic::campaign::reference::encounter_categories::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::campaign::reference::encounter_categories");

    // Test query for academic::campaign::reference::implementations
    let result = models::academic::campaign::reference::implementations::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::campaign::reference::implementations");

    // Test query for academic::campaign::reference::scopes
    let result = models::academic::campaign::reference::scopes::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::campaign::reference::scopes");

    // Test query for academic::campaign::reference::substances
    let result = models::academic::campaign::reference::substances::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::campaign::reference::substances");

    // Test query for academic::campaign::transaction::activities
    let result = models::academic::campaign::transaction::activities::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::campaign::transaction::activities");

    // Test query for academic::campaign::transaction::calendar_details
    let result = models::academic::campaign::transaction::calendar_details::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::campaign::transaction::calendar_details");

    // Test query for academic::campaign::transaction::calendars
    let result = models::academic::campaign::transaction::calendars::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::campaign::transaction::calendars");

    // Test query for academic::campaign::transaction::class_codes
    let result = models::academic::campaign::transaction::class_codes::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::campaign::transaction::class_codes");

    // Test query for academic::campaign::transaction::grades
    let result = models::academic::campaign::transaction::grades::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::campaign::transaction::grades");

    // Test query for academic::campaign::transaction::schedules
    let result = models::academic::campaign::transaction::schedules::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::campaign::transaction::schedules");

    // Test query for academic::campaign::transaction::teach_decrees
    let result = models::academic::campaign::transaction::teach_decrees::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::campaign::transaction::teach_decrees");

    // Test query for academic::campaign::transaction::teach_evaluations
    let result = models::academic::campaign::transaction::teach_evaluations::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::campaign::transaction::teach_evaluations");

    // Test query for academic::campaign::transaction::teach_lecturers
    let result = models::academic::campaign::transaction::teach_lecturers::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::campaign::transaction::teach_lecturers");

    // Test query for academic::campaign::transaction::teaches
    let result = models::academic::campaign::transaction::teaches::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::campaign::transaction::teaches");

    // Test query for academic::candidate::master::candidate_unit
    let result = models::academic::candidate::master::candidate_unit::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::candidate::master::candidate_unit");

    // Test query for academic::candidate::master::candidates
    let result = models::academic::candidate::master::candidates::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::candidate::master::candidates");

    // Test query for academic::candidate::master::exam_classes
    let result = models::academic::candidate::master::exam_classes::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::candidate::master::exam_classes");

    // Test query for academic::candidate::reference::document_types
    let result = models::academic::candidate::reference::document_types::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::candidate::reference::document_types");

    // Test query for academic::candidate::reference::phases
    let result = models::academic::candidate::reference::phases::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::candidate::reference::phases");

    // Test query for academic::candidate::reference::registration_categories
    let result = models::academic::candidate::reference::registration_categories::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::candidate::reference::registration_categories");

    // Test query for academic::candidate::reference::registration_types
    let result = models::academic::candidate::reference::registration_types::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::candidate::reference::registration_types");

    // Test query for academic::candidate::transaction::candidate_unit_choices
    let result = models::academic::candidate::transaction::candidate_unit_choices::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::candidate::transaction::candidate_unit_choices");

    // Test query for academic::candidate::transaction::documents
    let result = models::academic::candidate::transaction::documents::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::candidate::transaction::documents");

    // Test query for academic::candidate::transaction::exams
    let result = models::academic::candidate::transaction::exams::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::candidate::transaction::exams");

    // Test query for academic::course::master::concentrations
    let result = models::academic::course::master::concentrations::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::course::master::concentrations");

    // Test query for academic::course::master::course_evaluation_plannings
    let result = models::academic::course::master::course_evaluation_plannings::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::course::master::course_evaluation_plannings");

    // Test query for academic::course::master::course_learn_plannings
    let result = models::academic::course::master::course_learn_plannings::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::course::master::course_learn_plannings");

    // Test query for academic::course::master::courses
    let result = models::academic::course::master::courses::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::course::master::courses");

    // Test query for academic::course::master::curriculum_details
    let result = models::academic::course::master::curriculum_details::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::course::master::curriculum_details");

    // Test query for academic::course::master::curriculums
    let result = models::academic::course::master::curriculums::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::course::master::curriculums");

    // Test query for academic::course::reference::competences
    let result = models::academic::course::reference::competences::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::course::reference::competences");

    // Test query for academic::course::reference::course_evaluation_bases
    let result = models::academic::course::reference::course_evaluation_bases::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::course::reference::course_evaluation_bases");

    // Test query for academic::course::reference::curriculum_types
    let result = models::academic::course::reference::curriculum_types::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::course::reference::curriculum_types");

    // Test query for academic::course::reference::encounter_types
    let result = models::academic::course::reference::encounter_types::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::course::reference::encounter_types");

    // Test query for academic::course::reference::evaluation_types
    let result = models::academic::course::reference::evaluation_types::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::course::reference::evaluation_types");

    // Test query for academic::course::reference::groups
    let result = models::academic::course::reference::groups::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::course::reference::groups");

    // Test query for academic::course::reference::semesters
    let result = models::academic::course::reference::semesters::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::course::reference::semesters");

    // Test query for academic::course::reference::varieties
    let result = models::academic::course::reference::varieties::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::course::reference::varieties");

    // Test query for academic::general::reference::academic_year_categories
    let result = models::academic::general::reference::academic_year_categories::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::general::reference::academic_year_categories");

    // Test query for academic::general::reference::academic_years
    let result = models::academic::general::reference::academic_years::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::general::reference::academic_years");

    // Test query for academic::lecturer::master::lecturers
    let result = models::academic::lecturer::master::lecturers::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::lecturer::master::lecturers");

    // Test query for academic::lecturer::reference::contracts
    let result = models::academic::lecturer::reference::contracts::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::lecturer::reference::contracts");

    // Test query for academic::lecturer::reference::groups
    let result = models::academic::lecturer::reference::groups::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::lecturer::reference::groups");

    // Test query for academic::lecturer::reference::ranks
    let result = models::academic::lecturer::reference::ranks::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::lecturer::reference::ranks");

    // Test query for academic::lecturer::reference::statuses
    let result = models::academic::lecturer::reference::statuses::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::lecturer::reference::statuses");

    // Test query for academic::lecturer::transaction::academic_groups
    let result = models::academic::lecturer::transaction::academic_groups::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::lecturer::transaction::academic_groups");

    // Test query for academic::lecturer::transaction::academic_ranks
    let result = models::academic::lecturer::transaction::academic_ranks::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::lecturer::transaction::academic_ranks");

    // Test query for academic::lecturer::transaction::homebases
    let result = models::academic::lecturer::transaction::homebases::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::lecturer::transaction::homebases");

    // Test query for academic::prior_learning_recognition::reference::evaluator_types
    let result = models::academic::prior_learning_recognition::reference::evaluator_types::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::prior_learning_recognition::reference::evaluator_types");

    // Test query for academic::prior_learning_recognition::reference::evidence_categories
    let result = models::academic::prior_learning_recognition::reference::evidence_categories::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::prior_learning_recognition::reference::evidence_categories");

    // Test query for academic::prior_learning_recognition::reference::evidence_types
    let result = models::academic::prior_learning_recognition::reference::evidence_types::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::prior_learning_recognition::reference::evidence_types");

    // Test query for academic::prior_learning_recognition::reference::professionalisms
    let result = models::academic::prior_learning_recognition::reference::professionalisms::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::prior_learning_recognition::reference::professionalisms");

    // Test query for academic::prior_learning_recognition::transaction::decrees
    let result = models::academic::prior_learning_recognition::transaction::decrees::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::prior_learning_recognition::transaction::decrees");

    // Test query for academic::prior_learning_recognition::transaction::evaluation_details
    let result = models::academic::prior_learning_recognition::transaction::evaluation_details::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::prior_learning_recognition::transaction::evaluation_details");

    // Test query for academic::prior_learning_recognition::transaction::evaluations
    let result = models::academic::prior_learning_recognition::transaction::evaluations::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::prior_learning_recognition::transaction::evaluations");

    // Test query for academic::prior_learning_recognition::transaction::evaluators
    let result = models::academic::prior_learning_recognition::transaction::evaluators::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::prior_learning_recognition::transaction::evaluators");

    // Test query for academic::prior_learning_recognition::transaction::recognitions
    let result = models::academic::prior_learning_recognition::transaction::recognitions::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::prior_learning_recognition::transaction::recognitions");

    // Test query for academic::student::adviser::counsellors
    let result = models::academic::student::adviser::counsellors::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::student::adviser::counsellors");

    // Test query for academic::student::adviser::decrees
    let result = models::academic::student::adviser::decrees::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::student::adviser::decrees");

    // Test query for academic::student::campaign::convertions
    let result = models::academic::student::campaign::convertions::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::student::campaign::convertions");

    // Test query for academic::student::campaign::detail_activities
    let result = models::academic::student::campaign::detail_activities::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::student::campaign::detail_activities");

    // Test query for academic::student::campaign::detail_activity_evaluation_components
    let result = models::academic::student::campaign::detail_activity_evaluation_components::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::student::campaign::detail_activity_evaluation_components");

    // Test query for academic::student::campaign::student_activities
    let result = models::academic::student::campaign::student_activities::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::student::campaign::student_activities");

    // Test query for academic::student::final_assignment::reference::adviser_categories
    let result = models::academic::student::final_assignment::reference::adviser_categories::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::student::final_assignment::reference::adviser_categories");

    // Test query for academic::student::final_assignment::reference::approval_types
    let result = models::academic::student::final_assignment::reference::approval_types::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::student::final_assignment::reference::approval_types");

    // Test query for academic::student::final_assignment::reference::categories
    let result = models::academic::student::final_assignment::reference::categories::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::student::final_assignment::reference::categories");

    // Test query for academic::student::final_assignment::reference::requirements
    let result = models::academic::student::final_assignment::reference::requirements::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::student::final_assignment::reference::requirements");

    // Test query for academic::student::final_assignment::reference::stages
    let result = models::academic::student::final_assignment::reference::stages::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::student::final_assignment::reference::stages");

    // Test query for academic::student::final_assignment::reference::varieties
    let result = models::academic::student::final_assignment::reference::varieties::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::student::final_assignment::reference::varieties");

    // Test query for academic::student::final_assignment::transaction::advisers
    let result = models::academic::student::final_assignment::transaction::advisers::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::student::final_assignment::transaction::advisers");

    // Test query for academic::student::final_assignment::transaction::evaluation_details
    let result = models::academic::student::final_assignment::transaction::evaluation_details::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::student::final_assignment::transaction::evaluation_details");

    // Test query for academic::student::final_assignment::transaction::evaluation_summaries
    let result = models::academic::student::final_assignment::transaction::evaluation_summaries::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::student::final_assignment::transaction::evaluation_summaries");

    // Test query for academic::student::final_assignment::transaction::final_assignment_decrees
    let result = models::academic::student::final_assignment::transaction::final_assignment_decrees::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::student::final_assignment::transaction::final_assignment_decrees");

    // Test query for academic::student::final_assignment::transaction::prerequisites
    let result = models::academic::student::final_assignment::transaction::prerequisites::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::student::final_assignment::transaction::prerequisites");

    // Test query for academic::student::final_assignment::transaction::schedules
    let result = models::academic::student::final_assignment::transaction::schedules::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::student::final_assignment::transaction::schedules");

    // Test query for academic::student::final_assignment::transaction::submissions
    let result = models::academic::student::final_assignment::transaction::submissions::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::student::final_assignment::transaction::submissions");

    // Test query for academic::student::master::images
    let result = models::academic::student::master::images::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::student::master::images");

    // Test query for academic::student::master::students
    let result = models::academic::student::master::students::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::student::master::students");

    // Test query for academic::student::reference::finances
    let result = models::academic::student::reference::finances::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::student::reference::finances");

    // Test query for academic::student::reference::registrations
    let result = models::academic::student::reference::registrations::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::student::reference::registrations");

    // Test query for academic::student::reference::resign_statuses
    let result = models::academic::student::reference::resign_statuses::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::student::reference::resign_statuses");

    // Test query for academic::student::reference::selection_types
    let result = models::academic::student::reference::selection_types::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::student::reference::selection_types");

    // Test query for academic::student::reference::statuses
    let result = models::academic::student::reference::statuses::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::student::reference::statuses");

    // Test query for academic::survey::master::answers
    let result = models::academic::survey::master::answers::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::survey::master::answers");

    // Test query for academic::survey::master::bundle_question
    let result = models::academic::survey::master::bundle_question::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::survey::master::bundle_question");

    // Test query for academic::survey::master::bundles
    let result = models::academic::survey::master::bundles::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::survey::master::bundles");

    // Test query for academic::survey::master::questions
    let result = models::academic::survey::master::questions::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::survey::master::questions");

    // Test query for academic::survey::reference::bundle_categories
    let result = models::academic::survey::reference::bundle_categories::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::survey::reference::bundle_categories");

    // Test query for academic::survey::reference::question_varieties
    let result = models::academic::survey::reference::question_varieties::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::survey::reference::question_varieties");

    // Test query for academic::survey::transaction::conducts
    let result = models::academic::survey::transaction::conducts::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::survey::transaction::conducts");

    // Test query for academic::survey::transaction::responds
    let result = models::academic::survey::transaction::responds::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for academic::survey::transaction::responds");

}
