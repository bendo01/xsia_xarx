use salvo::async_trait;
use sea_orm::DatabaseConnection;

pub mod example;
pub mod feeder_dikti;
pub mod route_list;
pub mod sync_permissions;
pub mod utilities;

#[async_trait]
pub trait Task: Send + Sync {
    /// The name of the task
    fn name(&self) -> &str;
    
    /// Description of the task
    fn description(&self) -> &str;
    
    /// Execute the task
    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>>;
}

pub fn get_tasks() -> Vec<Box<dyn Task>> {
    vec![
        Box::new(example::ExampleTask),
        Box::new(sync_permissions::SyncPermissionsTask),
        Box::new(route_list::RouteListTask),
        Box::new(utilities::hash_password::HashPasswordTask),
    ]
}

pub async fn run_task(name: Option<String>, args: &[String], db: &DatabaseConnection) -> Result<(), Box<dyn std::error::Error>> {
    let tasks = get_tasks();
    
    if let Some(task_name) = name {
        for task in &tasks {
            if task.name() == task_name 
                || task.name().replace(':', "_") == task_name 
                || task.name().replace('_', ":") == task_name 
            {
                println!("Running task: {}", task.name());
                return task.run(db, args).await;
            }
        }
        println!("Task '{}' not found. Available tasks:", task_name);
        for task in &tasks {
            println!("  {:<20} {}", task.name(), task.description());
        }
    } else {
        println!("Available tasks:");
        for task in &tasks {
            println!("  {:<20} {}", task.name(), task.description());
        }
    }
    
    Ok(())
}
