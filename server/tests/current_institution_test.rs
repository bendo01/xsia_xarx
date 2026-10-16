use sea_orm::{DatabaseBackend, MockDatabase, Value};
use std::collections::BTreeMap;
use uuid::Uuid;
use xsia_xarx::config::institution::CurrentInstitution;

fn id_row(id: Uuid) -> BTreeMap<&'static str, Value> {
    BTreeMap::from([("institution_id", Value::from(id))])
}

#[tokio::test]
async fn loads_institution_of_the_single_credential() {
    let id = Uuid::new_v4();
    let code_row = BTreeMap::from([("code", Value::from(Some("092010".to_string())))]);
    let db = MockDatabase::new(DatabaseBackend::Postgres)
        .append_query_results([vec![id_row(id)]])
        .append_query_results([vec![code_row]])
        .into_connection();

    let current = CurrentInstitution::load(&db).await.unwrap();
    assert_eq!(current, CurrentInstitution { id, code: Some("092010".to_string()) });
}

#[tokio::test]
async fn fails_without_credential() {
    let db = MockDatabase::new(DatabaseBackend::Postgres)
        .append_query_results([Vec::<BTreeMap<&str, Value>>::new()])
        .into_connection();

    let err = CurrentInstitution::load(&db).await.unwrap_err().to_string();
    assert!(err.contains("utility:feeder-add-credential"), "{err}");
}

#[tokio::test]
async fn fails_with_credentials_for_several_institutions() {
    let db = MockDatabase::new(DatabaseBackend::Postgres)
        .append_query_results([vec![id_row(Uuid::new_v4()), id_row(Uuid::new_v4())]])
        .into_connection();

    let err = CurrentInstitution::load(&db).await.unwrap_err().to_string();
    assert!(err.contains("more than one institution"), "{err}");
}
