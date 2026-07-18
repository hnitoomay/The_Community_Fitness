# Database Migrations

Place future PostgreSQL migration SQL files in this directory.

This project is not using Prisma or another ORM for migrations. When
database work is requested later, migration scripts should be written as
plain SQL and run manually with the pgAdmin Query Tool.

Do not run migrations with `psql` for this project unless that approach
is explicitly requested later.
