use salvo::prelude::*;
use salvo::oapi::{OpenApi, swagger_ui::SwaggerUi};
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

    let api_router = Router::with_path("api/v1")
        .hoop(InjectDb(db))
        .push(controllers::person::reference::router())
        .push(controllers::person::master::router())
        .push(controllers::literate::router());

    let doc = OpenApi::new("API (Person & Literate)", "1.0.0").merge_router(&api_router);

    let router = Router::new()
        .push(api_router)
        .push(doc.into_router("api/v1/api-docs/openapi.json"))
        .push(SwaggerUi::new("/api/v1/api-docs/openapi.json").into_router("api/v1/swagger-ui"));

    println!("Server running at http://127.0.0.1:5800");
    println!("Swagger UI:   http://127.0.0.1:5800/api/v1/swagger-ui/");
    println!("OpenAPI JSON: http://127.0.0.1:5800/api/v1/api-docs/openapi.json");

    let acceptor = TcpListener::new("127.0.0.1:5800").bind().await;
    Server::new(acceptor).serve(router).await;

    Ok(())
}
