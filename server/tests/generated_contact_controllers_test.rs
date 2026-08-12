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
async fn test_contact_controllers() {
    let router = controllers::contact::router();
    let service = Service::new(router).hoop(inject_db);

    let paths = vec![
        "/master/electronic-mails",
        "/master/phones",
        "/master/residences",
        "/master/websites",
        "/reference/electronic-mail-types",
        "/reference/phone-types",
        "/reference/residence-types",
        "/reference/website-types",
    ];

    for path in paths {
        let url = format!("http://127.0.0.1:5800{}", path);
        let res = TestClient::get(&url).send(&service).await;
        assert!(res.status_code.is_some(), "Failed to reach {}", path);
    }
}
