use sea_orm_migration::prelude::*;

pub mod m20260901_000001_schema_compliance_table_experiment_runs;
pub mod m20260901_000002_schema_compliance_table_experiment_metrics;
pub mod m20260901_000003_schema_compliance_table_duplicate_candidates;
pub mod m20260901_000004_schema_compliance_table_regulation_documents;
pub mod m20260901_000005_schema_compliance_table_anomaly_events;
pub mod m20260901_000006_schema_compliance_table_gold_labels;

/// Creates the `compliance` schema; every table migration calls it so ordering does not matter.
pub(crate) async fn ensure_schema(manager: &SchemaManager<'_>) -> Result<(), DbErr> {
    manager
        .get_connection()
        .execute_unprepared("CREATE SCHEMA IF NOT EXISTS compliance")
        .await
        .map(|_| ())
}

pub(crate) fn tbl(name: &str) -> (Alias, Alias) {
    (Alias::new("compliance"), Alias::new(name))
}

/// `id` column: uuid v7 default, same as the other schemas.
pub(crate) fn id_col() -> ColumnDef {
    ColumnDef::new("id")
        .uuid()
        .not_null()
        .default(Expr::cust("public.uuid_generate_v7()"))
        .to_owned()
}

/// Standard audit columns (`created_at` … `updated_by`).
pub(crate) fn add_audit_cols(table: &mut TableCreateStatement) {
    let zero = "'00000000-0000-0000-0000-000000000000'::uuid";
    table
        .col(ColumnDef::new("created_at").date_time().default(Expr::cust("now()")))
        .col(ColumnDef::new("updated_at").date_time().default(Expr::cust("now()")))
        .col(ColumnDef::new("deleted_at").date_time())
        .col(ColumnDef::new("sync_at").date_time())
        .col(ColumnDef::new("created_by").uuid().default(Expr::cust(zero)))
        .col(ColumnDef::new("updated_by").uuid().default(Expr::cust(zero)));
}

pub(crate) async fn drop(manager: &SchemaManager<'_>, name: &str) -> Result<(), DbErr> {
    manager
        .drop_table(Table::drop().table(tbl(name)).if_exists().to_owned())
        .await
}

pub(crate) async fn index(
    manager: &SchemaManager<'_>,
    name: &str,
    table: &str,
    cols: &[&str],
) -> Result<(), DbErr> {
    let mut stmt = Index::create();
    stmt.name(name).table(tbl(table)).if_not_exists();
    for c in cols {
        stmt.col(Alias::new(*c));
    }
    manager.create_index(stmt.to_owned()).await
}
