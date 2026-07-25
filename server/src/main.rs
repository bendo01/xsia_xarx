use xsia_xarx::db;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let db = db::connect_db().await?;
    println!("Database connection successful: {:?}", db);

    Ok(())
}

