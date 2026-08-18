use salvo::prelude::*;
use salvo::oapi::{OpenApi, swagger_ui::SwaggerUi};
use sea_orm::DatabaseConnection;
use clap::{Parser, Subcommand};
use xsia_xarx::{controllers, db};
use xsia_xarx::config::redis::RedisConfig;
use xsia_xarx::jobs::email::{EmailJob, start_email_worker};
use apalis_redis::RedisStorage;

struct InjectDb(DatabaseConnection);

struct InjectRedis(RedisStorage<EmailJob>);

#[async_trait]
impl Handler for InjectRedis {
    async fn handle(
        &self,
        req: &mut Request,
        depot: &mut Depot,
        res: &mut Response,
        ctrl: &mut FlowCtrl,
    ) {
        depot.insert_typed::<RedisStorage<EmailJob>>(self.0.clone());
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
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let cli = Cli::parse();

    tracing_subscriber::fmt::init();

    let db = db::connect_db().await?;
    println!("Database connection successful");

    if let Some(command) = cli.command {
        match command {
            Commands::Task { name, args } => {
                xsia_xarx::tasks::run_task(name, &args, &db).await?;
                return Ok(());
            }
        }
    }

    let redis_config = RedisConfig::from_env();
    let redis_url = redis_config.url;
    let email_worker = start_email_worker(redis_url.clone()).await?;
    let conn = apalis_redis::connect(redis_url).await.map_err(|e| std::io::Error::other(e.to_string()))?;
    let redis_storage = apalis_redis::RedisStorage::new(conn);
    
    tokio::spawn(async move {
        let _ = email_worker.run().await;
    });
    println!("Apalis email worker started");

    let cors = salvo::cors::Cors::new()
        .allow_origin(salvo::cors::Any)
        .allow_methods(salvo::cors::Any)
        .allow_headers(salvo::cors::Any)
        .into_handler();

    let api_router = Router::with_path("api/v1")
        .hoop(InjectDb(db))
        .hoop(InjectRedis(redis_storage))
        .push(controllers::person::reference::router())
        .push(controllers::person::master::router())
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
