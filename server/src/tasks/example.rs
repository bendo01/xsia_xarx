use salvo::async_trait;
use sea_orm::DatabaseConnection;
use super::Task;

pub struct ExampleTask;

#[async_trait]
impl Task for ExampleTask {
    fn name(&self) -> &str {
        "example"
    }

    fn description(&self) -> &str {
        "An example task that prints a message"
    }

    async fn run(&self, _db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        println!("Example task executed successfully!");
        if !args.is_empty() {
            println!("Provided arguments: {:?}", args);
        }
        Ok(())
    }
}
