# Local PostgreSQL Setup

This project uses a local PostgreSQL server with the `pg` package
(`node-postgres`) for server-side database access.

## Environment Variable

Store the connection string in `.env.local` as:

```env
DATABASE_URL=postgresql://USERNAME:PASSWORD@localhost:5432/the_community_fitness
```

Do not expose `DATABASE_URL` to browser code. The database connection is
read only from server-side code in `src/lib/server/db.ts`.

## Server-Side Connection

- The project uses a shared PostgreSQL connection pool.
- During development, the same pool instance is reused to avoid creating
  extra connections on every hot reload.
- If `DATABASE_URL` is missing, the server throws a safe configuration
  error without exposing credentials.

## Health Check Route

Use the database health check route to verify the local connection:

`GET /api/health/db`

When PostgreSQL is reachable, the route returns:

```json
{ "ok": true }
```

If the connection fails, the route returns:

```json
{ "ok": false, "error": "Database connection failed" }
```

The route does not return stack traces or database credentials.

## Future SQL Workflow

Future schema changes and seed data will be managed as SQL files under:

- `database/migrations`
- `database/seeds`

Those SQL scripts will be run manually using the **pgAdmin Query Tool**.
This project is not using `psql` for the planned manual workflow unless
that is explicitly requested later.

## Running the First Schema in pgAdmin

When you are ready to create the first admin reference schema:

1. Open pgAdmin and connect to your local PostgreSQL server.
2. In the left tree, select the `the_community_fitness` database.
3. Open **Tools > Query Tool**.
4. Open the file:
   `database/migrations/001_admin_reference_schema.sql`
5. Review the SQL, then execute it from the pgAdmin Query Tool.

This migration creates the initial admin reference tables only. It does
not create authentication tables, client profile tables, or generated
plan tables.
