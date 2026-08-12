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
async fn test_person_reference_controllers() {
    let router = controllers::person::reference::router();
    let service = Service::new(router).hoop(inject_db);

    let paths = vec![
        "/reference/age-classification",
        "/reference/blood-type",
        "/reference/eye-color",
        "/reference/gender",
        "/reference/hair-color",
        "/reference/hair-type",
        "/reference/identification-type",
        "/reference/income",
        "/reference/marital-status",
        "/reference/occupation",
        "/reference/profession",
        "/reference/relative-type",
        "/reference/religion",
    ];

    for path in paths {
        let url = format!("http://127.0.0.1:5800{}", path);
        let res = TestClient::get(&url).send(&service).await;
        assert_eq!(
            res.status_code,
            Some(StatusCode::OK),
            "Failed GET on {}",
            path
        );
    }

    // Test OpenAPI spec JSON (removed because openapi is not mounted on this sub-router)
    /*
    let res = TestClient::get("http://127.0.0.1:5800/api-docs/openapi.json")
        .send(&service)
        .await;
    assert_eq!(res.status_code, Some(StatusCode::OK));

    // Test Swagger UI endpoint (returns 200 on /swagger-ui/ or 302 redirect on /swagger-ui)
    let res = TestClient::get("http://127.0.0.1:5800/swagger-ui/")
        .send(&service)
        .await;
    assert_eq!(res.status_code, Some(StatusCode::OK));
    */
}
