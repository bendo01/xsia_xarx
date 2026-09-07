use salvo::prelude::*;
use salvo::oapi::{OpenApi, swagger_ui::SwaggerUi};
use sea_orm::DatabaseConnection;
use clap::{Parser, Subcommand};
use xsia_xarx::{controllers, db};
use xsia_xarx::config::database::DatabaseConfig;
use xsia_xarx::jobs::email::{start_email_worker, init_email_queue};
use pgmq::PGMQueueExt;

struct InjectDb(DatabaseConnection);

struct InjectPgmq(PGMQueueExt);

#[async_trait]
impl Handler for InjectPgmq {
    async fn handle(
        &self,
        req: &mut Request,
        depot: &mut Depot,
        res: &mut Response,
        ctrl: &mut FlowCtrl,
    ) {
        depot.insert_typed::<PGMQueueExt>(self.0.clone());
        ctrl.call_next(req, depot, res).await;
    }
}

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

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand, Debug)]
enum Commands {
    /// Task runner
    Task {
        /// The name of the task to run
        name: Option<String>,
        
        /// Task arguments
        #[arg(trailing_var_arg = true, allow_hyphen_values = true)]
        args: Vec<String>,
    },
    /// List all registered routes, methods, handlers, and route names
    #[command(name = "route:list")]
    RouteList {
        /// Optional filter keyword
        filter: Option<String>,
    },
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let cli = Cli::parse();

    if let Some(command) = cli.command {
        match command {
            Commands::RouteList { filter } => {
                let args = filter.map(|f| vec![f]).unwrap_or_default();
                xsia_xarx::tasks::route_list::print_route_list(&args);
                return Ok(());
            }
            Commands::Task { name, args } => {
                let db = db::connect_db().await?;
                println!("Database connection successful");
                xsia_xarx::tasks::run_task(name, &args, &db).await?;
                return Ok(());
            }
        }
    }

    tracing_subscriber::fmt::init();

    let db = db::connect_db().await?;
    println!("Database connection successful");

    let db_config = DatabaseConfig::from_env();
    let queue = PGMQueueExt::new(db_config.url, 10)
        .await
        .map_err(|e| std::io::Error::other(format!("Failed to connect to PGMQ: {e}")))?;

    // Initialize PGMQ extension / schema if needed
    if let Err(e) = queue.init().await {
        tracing::warn!("Extension pgmq init notice: {e}. Attempting embedded SQL fallback...");
        if let Err(e_sql) = queue.install_sql_from_embedded().await {
            tracing::warn!("Embedded SQL init notice: {e_sql}");
        }
    }

    init_email_queue(&queue)
        .await
        .map_err(|e| std::io::Error::other(format!("Failed to initialize email queue: {e}")))?;

    start_email_worker(queue.clone());
    println!("PGMQ email worker started");

    let cors = salvo::cors::Cors::new()
        .allow_origin(salvo::cors::Any)
        .allow_methods(salvo::cors::Any)
        .allow_headers(salvo::cors::Any)
        .into_handler();

    let api_router = Router::with_path("api/v1")
        .hoop(InjectDb(db))
        .hoop(InjectPgmq(queue))
        .push(controllers::person::router())
        .push(controllers::literate::router())
        .push(controllers::location::router())
        .push(controllers::institution::router())
        .push(controllers::building::router())
        .push(controllers::contact::router())
        .push(controllers::document::router())
        .push(controllers::academic::router())
        .push(controllers::feeder::router())
        .push(controllers::auth::router())
        .push(controllers::realtime::router());

    let doc = OpenApi::new("API", "1.0.0").merge_router(&api_router);

    let router = Router::new()
        .push(api_router)
        .push(doc.into_router("api/v1/api-docs/openapi.json"))
        .push(SwaggerUi::new("/api/v1/api-docs/openapi.json").into_router("api/v1/swagger-ui"));

    println!("Server running at http://127.0.0.1:5800");
    println!("Swagger UI:   http://127.0.0.1:5800/api/v1/swagger-ui/");
    println!("OpenAPI JSON: http://127.0.0.1:5800/api/v1/api-docs/openapi.json");

    let service = Service::new(router).hoop(cors);
    let acceptor = TcpListener::new("127.0.0.1:5800").bind().await;
    Server::new(acceptor).serve(service).await;

    Ok(())
}
