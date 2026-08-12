use sea_orm::*;
use xsia_xarx::db::connect_db;
use xsia_xarx::models;

#[tokio::test]
async fn test_location_models_query() {
    let db = connect_db().await.expect("Failed to connect to the database");

    // Test query for location::continents
    let result = models::location::continents::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for location::continents");

    // Test query for location::countries
    let result = models::location::countries::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for location::countries");

    // Test query for location::provinces
    let result = models::location::provinces::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for location::provinces");

    // Test query for location::regencies
    let result = models::location::regencies::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for location::regencies");

    // Test query for location::regency_types
    let result = models::location::regency_types::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for location::regency_types");

    // Test query for location::regions
    let result = models::location::regions::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for location::regions");

    // Test query for location::sub_districts
    let result = models::location::sub_districts::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for location::sub_districts");

    // Test query for location::villages
    let result = models::location::villages::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for location::villages");

}
