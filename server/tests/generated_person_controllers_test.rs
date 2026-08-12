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
async fn test_person_controllers() {
    let router = controllers::person::router();
    let service = Service::new(router).hoop(inject_db);

    let paths = vec![
        "/master/biodata",
        "/master/individual",
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
        assert!(res.status_code.is_some(), "Failed to reach {}", path);
    }
}
