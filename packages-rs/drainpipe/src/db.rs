use diesel::prelude::*;
use diesel::sqlite::SqliteConnection;
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};

use crate::ProcessErrorKind;

pub fn db_connect(database_url: &String) -> anyhow::Result<SqliteConnection> {
    SqliteConnection::establish(&database_url).map_err(Into::into)
}

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");
pub fn run_migrations(
    conn: &mut SqliteConnection,
) -> Result<(), Box<dyn std::error::Error + Send + Sync + 'static>> {
    conn.run_pending_migrations(MIGRATIONS)?;

    Ok(())
}

pub fn update_seq(conn: &mut SqliteConnection, new_seq: i64) -> anyhow::Result<()> {
    use crate::schema::drainpipe::dsl::*;

    diesel::update(drainpipe.filter(rowid.eq(1)))
        .set(seq.eq(&new_seq))
        .execute(conn)?;

    Ok(())
}

pub fn record_dead_letter(
    conn: &mut SqliteConnection,
    kind: ProcessErrorKind,
    new_msg: &str,
    new_seq: i64,
    message: &str,
) -> anyhow::Result<()> {
    use crate::schema::dead_letter_queue::dsl::*;

    diesel::insert_into(dead_letter_queue)
        .values((
            err_kind.eq(kind as i32),
            err_msg.eq(&new_msg),
            seq.eq(&new_seq),
            source.eq(&message),
        ))
        .execute(conn)?;

    Ok(())
}

pub fn get_seq(conn: &mut SqliteConnection) -> anyhow::Result<i64> {
    use crate::schema::drainpipe::dsl::*;

    let row = drainpipe.select(seq).first::<i64>(conn)?;

    Ok(row)
}

#[derive(Queryable, Selectable, PartialEq, Debug)]
#[diesel(table_name = crate::schema::drainpipe)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct DrainpipeMeta {
    pub seq: i64,
}

#[derive(Queryable, Selectable, PartialEq, Debug)]
#[diesel(table_name = crate::schema::dead_letter_queue)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct DeadLetter {
    pub seq: i64,
    pub err_kind: i32,
    pub err_msg: String,
    pub source: String,
}
