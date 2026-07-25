use salvo::prelude::*;
use sea_orm::DatabaseConnection;
use xsia_xarx::{controllers, db};

struct InjectDb(DatabaseConnection);

#[async_trait]
impl Handler for InjectDb {
    async fn handle(
        &self,
        req: &mut Request,
        depot: &mut Depot,
        res: &mut Response,
        ctrl: &mut FlowCtrl,
    ) {
        depot.insert_typed::<DatabaseConnection>(self.0.clone());
        ctrl.call_next(req, depot, res).await;
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let db = db::connect_db().await?;
    println!("Database connection successful");

    let router = Router::new().push(
        Router::with_path("api/v1")
            .hoop(InjectDb(db))
            .push(controllers::person::reference::router())
            .push(controllers::person::master::router()),
    );

    println!("Server running at http://127.0.0.1:5800");
    println!("--- Reference ---");
    println!("  Swagger UI:   http://127.0.0.1:5800/api/v1/swagger-ui/");
    println!("  OpenAPI JSON: http://127.0.0.1:5800/api/v1/api-docs/openapi.json");
    println!("--- Master ---");
    println!("  Swagger UI:   http://127.0.0.1:5800/api/v1/master/swagger-ui/");
    println!("  OpenAPI JSON: http://127.0.0.1:5800/api/v1/master/api-docs/openapi.json");

    let acceptor = TcpListener::new("127.0.0.1:5800").bind().await;
    Server::new(acceptor).serve(router).await;

    Ok(())
}
