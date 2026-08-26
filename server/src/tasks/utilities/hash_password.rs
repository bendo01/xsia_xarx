use argon2::{
    password_hash::{rand_core::OsRng, PasswordHasher, SaltString},
    Argon2,
};
use salvo::async_trait;
use sea_orm::DatabaseConnection;

use crate::tasks::Task;

pub struct HashPasswordTask;

#[async_trait]
impl Task for HashPasswordTask {
    fn name(&self) -> &str {
        "hash:password"
    }

    fn description(&self) -> &str {
        "Hashes input string/password using Argon2id and Bcrypt from arguments"
    }

    async fn run(&self, _db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        let input_password = if !args.is_empty() {
            args[0].clone()
        } else {
            use std::io::{self, Write};
            print!("Enter password to hash: ");
            io::stdout().flush()?;
            let mut input = String::new();
            io::stdin().read_line(&mut input)?;
            let trimmed = input.trim();
            if trimmed.is_empty() {
                eprintln!("Error: Password input cannot be empty.");
                eprintln!("Usage: cargo run -- task hash:password <password> [algorithm]");
                return Ok(());
            }
            trimmed.to_string()
        };

        let algo_arg = args.get(1).map(|s| s.to_lowercase());

        println!("\n{}", "=".repeat(60));
        println!(" PASSWORD HASHING UTILITY");
        println!("{}", "=".repeat(60));
        println!("Input: \"{}\"", input_password);
        println!("{}", "-".repeat(60));

        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        let argon2_hash = argon2
            .hash_password(input_password.as_bytes(), &salt)
            .map_err(|e| format!("Argon2 hashing error: {}", e))?
            .to_string();

        let bcrypt_hash = bcrypt::hash(&input_password, bcrypt::DEFAULT_COST)
            .map_err(|e| format!("Bcrypt hashing error: {}", e))?;

        match algo_arg.as_deref() {
            Some("argon2") => {
                println!("Algorithm: Argon2id (Application Standard)");
                println!("Hash:\n{}", argon2_hash);
            }
            Some("bcrypt") => {
                println!("Algorithm: Bcrypt (Cost {})", bcrypt::DEFAULT_COST);
                println!("Hash:\n{}", bcrypt_hash);
            }
            _ => {
                println!("Argon2id Hash (Used by Application Auth / Users):");
                println!("  {}", argon2_hash);
                println!();
                println!("Bcrypt Hash (Default Cost):");
                println!("  {}", bcrypt_hash);
            }
        }

        println!("{}", "=".repeat(60));
        println!();

        Ok(())
    }
}
