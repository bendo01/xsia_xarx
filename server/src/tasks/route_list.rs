use salvo::async_trait;
use sea_orm::DatabaseConnection;

use super::Task;
use crate::library::routes::get_system_routes;

pub struct RouteListTask;

#[async_trait]
impl Task for RouteListTask {
    fn name(&self) -> &str {
        "route:list"
    }

    fn description(&self) -> &str {
        "Lists all system routes with their URL path, HTTP method, handler function, and route name"
    }

    async fn run(&self, _db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        print_route_list(args);
        Ok(())
    }
}

pub fn print_route_list(args: &[String]) {
    let filter = args.first().map(|s| s.to_lowercase());
    let mut routes = get_system_routes();

    if let Some(ref f) = filter {
        routes.retain(|r| {
            r.url.to_lowercase().contains(f)
                || r.method.to_lowercase().contains(f)
                || r.handler.to_lowercase().contains(f)
                || r.name.to_lowercase().contains(f)
        });
    }

    let url_width = routes.iter().map(|r| r.url.len()).max().unwrap_or(30).max(8);
    let method_width = 8;
    let handler_width = routes.iter().map(|r| r.handler.len()).max().unwrap_or(30).max(18);
    let name_width = routes.iter().map(|r| r.name.len()).max().unwrap_or(30).max(10);

    let border = format!(
        "+-{}-+-{}-+-{}-+-{}-+",
        "-".repeat(url_width),
        "-".repeat(method_width),
        "-".repeat(handler_width),
        "-".repeat(name_width)
    );

    println!("\n{}", border);
    println!(
        "| {:<url_w$} | {:<meth_w$} | {:<hand_w$} | {:<name_w$} |",
        "URL Path",
        "Method",
        "Handler / Function",
        "Route Name",
        url_w = url_width,
        meth_w = method_width,
        hand_w = handler_width,
        name_w = name_width
    );
    println!("{}", border);

    for r in &routes {
        let method_padded = format!("{:<width$}", r.method, width = method_width);
        let method_colored = match r.method {
            "GET" => format!("\x1b[32m{}\x1b[0m", method_padded),
            "POST" => format!("\x1b[33m{}\x1b[0m", method_padded),
            "PUT" => format!("\x1b[34m{}\x1b[0m", method_padded),
            "PATCH" => format!("\x1b[36m{}\x1b[0m", method_padded),
            "DELETE" => format!("\x1b[31m{}\x1b[0m", method_padded),
            _ => method_padded,
        };

        println!(
            "| {:<url_w$} | {} | {:<hand_w$} | {:<name_w$} |",
            r.url,
            method_colored,
            r.handler,
            r.name,
            url_w = url_width,
            hand_w = handler_width,
            name_w = name_width
        );
    }

    println!("{}", border);
    println!("Total routes: {}\n", routes.len());
}
