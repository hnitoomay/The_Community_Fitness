<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# PROJECT OVERVIEW

The Community Fitness is a mobile-first AI-powered fitness coach app.

The application will:

- collect a client's basic profile
- collect body measurements
- allow the client to select a labelled body goal
- collect health conditions and simple preferences
- use the gym's actual equipment inventory
- use a curated exercise database
- use workout templates
- use a curated food database
- use nutrition templates
- generate a personalized one-month workout and nutrition plan
- display the plan through a mobile calendar
- display each day's workout and nutrition details
- maintain measurement and plan history

The AI must eventually select only exercises that are supported by
equipment available in this gym.

# TECHNOLOGY

Use:

- Next.js App Router
- TypeScript
- Tailwind CSS
- local PostgreSQL
- Prisma ORM for database access, schema, migrations and seed data
- npm for package management
- lucide-react for general interface icons when appropriate

Do not use Supabase.

Do not install or configure Prisma until specifically requested.
The first development milestone is UI only with mock data.

# DATABASE

The development database is a locally installed PostgreSQL server.

When database integration is requested later:

- use the `pg` package with a shared PostgreSQL connection pool
- use DATABASE_URL from environment variables
- write PostgreSQL schema and migration files as SQL
- place migrations in database/migrations
- place seed files in database/seeds
- use parameterized SQL queries
- never concatenate user input into SQL strings
- keep all database access on the server
- never expose DATABASE_URL to browser code
- keep database queries in a clear server-side repository or
  data-access layer
- do not put SQL directly inside React UI components
- use TypeScript interfaces for database records and query results
- preserve historical measurements and generated-plan versions
- do not delete, reset or recreate the database without explicit
  approval
- do not execute destructive SQL without first explaining its effect
- do not run migrations or seed commands until specifically requested

The local connection variable will eventually use this format:

DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/DATABASE_NAME"

Do not create the actual connection string yet.

# AUTHENTICATION

Do not implement authentication until specifically requested.

Local PostgreSQL is only the database and does not itself provide the
application login system.

For the current UI milestone:

- use mock authenticated states
- keep login, signup and logout buttons visual or locally simulated
- do not install an authentication library yet
- do not create insecure custom password handling
- do not store plain-text passwords

# TWO INTERFACE TYPES

This project contains two different interfaces:

1. CLIENT APPLICATION
2. ADMIN DASHBOARD

They must share the same brand identity but must use separate layouts
and responsive strategies.

# CLIENT APPLICATION DESIGN

The client-facing fitness application is mobile-first.

Client routes include:

- /login
- /home
- /profile
- /profile/body-goal
- /assessment
- /calendar
- /workout/[date]
- /history
- /settings

Client requirements:

- Design primarily for widths from 375px to 430px.
- Use approximately 390px as the main design preview.
- Center the mobile application on wider desktop screens.
- Use a maximum client content width of approximately 430px.
- Use mobile-safe spacing.
- Use touch-friendly controls.
- Use app-like cards, headers and bottom navigation.
- Do not create a desktop dashboard version of the client pages.
- Do not wrap the application in a decorative phone frame.

# ADMIN DASHBOARD DESIGN

The admin interface is desktop-first.

Admin routes will be placed under /admin.

Expected admin areas include:

- /admin
- /admin/equipment
- /admin/exercises
- /admin/workout-templates
- /admin/foods
- /admin/nutrition-templates
- /admin/body-goals

Admin requirements:

- Design primarily for laptop and desktop widths.
- Use a left sidebar and top header.
- Use the available desktop width effectively.
- Use tables, search, filters, pagination and wide data-entry forms.
- Allow admins to create, edit, view and deactivate reference data.
- Do not place admin pages inside the client's 430px mobile container.
- Keep admin pages usable on tablets.
- On narrow screens, the admin sidebar may collapse into a drawer.
- The main admin target remains desktop, not mobile.
- Avoid oversized cards when a clear table or structured form is more
  appropriate.

# VISUAL STYLE

- Main background: white.
- Primary brand color: vivid red.
- Main headings: black.
- Secondary text: gray.
- Text on primary red buttons: white.
- Use rounded cards.
- Use subtle borders.
- Use soft shadows.
- Use clean spacing.
- Avoid visual clutter.
- Avoid excessive gradients.
- Use red for primary actions, important icons and active states.
- Maintain one consistent visual system across every screen.

# CODE ORGANIZATION

- Use reusable components instead of duplicated UI.
- Use strict TypeScript.
- Avoid any unless there is no practical typed alternative.
- Keep server and client code clearly separated.
- Keep large mock datasets outside page components.
- Prefer a structure such as:

  src/app
  src/app/admin
  src/components
  src/components/client
  src/components/admin
  src/components/ui
  src/components/shared
  src/lib
  src/data
  src/types
  prisma
  docs
  public

- Use server components by default.
- Add "use client" only when interactivity requires it.
- Keep components focused and reasonably small.
- Do not put an entire complex page into one oversized component.
- Create separate layouts and components for client and admin areas.
- Client-specific components must not control the admin layout.
- Admin-specific components must not control the client layout.
- Preserve existing working features unless a requested change requires
  modifying them.

Shared UI elements may include:

- color tokens
- typography
- buttons
- inputs
- labels
- validation messages
- badges
- modal foundations
- icons

# BUSINESS DATA MODEL

The application will eventually include these data areas:

USER DATA
- users
- profiles
- body measurements
- health conditions
- exercise dislikes
- food allergies
- food restrictions
- disliked foods
- selected body goal

REFERENCE DATA
- body goals
- gym equipment types
- gym equipment inventory
- exercises
- exercise-to-equipment relationships
- workout templates
- foods
- nutrition templates

GENERATED DATA
- AI assessments
- one-month plans
- plan days
- plan exercises
- plan meals
- plan versions
- workout completion history
- measurement history

# EQUIPMENT SYSTEM

The gym equipment inventory is separate from the exercise database.

Examples:

- Leg Press is equipment.
- Machine Leg Press is an exercise.
- Smith Machine is equipment.
- Smith Machine Squat is an exercise.

An exercise may require:

- no equipment
- one equipment type
- multiple equipment types

The database must eventually connect exercises to the equipment they
require.

Not every inventory item is selectable for workout generation.

Examples of non-workout inventory:

- dumbbell rack
- barbell rack
- storage rack
- body-fat scale
- barbell clip

These items may remain in inventory but must not be treated as
exercises.

# ADMIN DATA RESPONSIBILITIES

The admin dashboard will eventually manage:

- gym equipment inventory
- equipment availability
- equipment quantities
- exercises
- exercise categories
- exercise-to-equipment relationships
- body goals
- workout templates
- foods
- food categories
- nutrition templates

The uploaded gym inventory contains source items 1 through 89 that will
eventually be entered or imported through the equipment system.

The admin interface must make it clear that:

- equipment is not the same as an exercise
- one exercise may require multiple equipment types
- some inventory items are not selectable for workout generation
- admins can mark equipment active, inactive or unavailable
- admins can map exercises to the required equipment

# AI BEHAVIOR

Do not implement AI integration until specifically requested.

When AI integration is added later:

- use the selected body-goal ID, label and description
- do not ask AI to visually interpret the goal image
- filter eligible exercises using the available equipment
- provide the AI with approved exercises rather than allowing it to
  invent unknown exercises
- use workout templates as the plan structure
- use nutrition templates as the meal structure
- return structured JSON
- validate AI output before saving it
- never expose an AI API key in browser code
- keep AI requests server-side

# DEVELOPMENT ORDER

Follow this project order unless the user explicitly changes it:

1. Create the mobile design system.
2. Build screens using mock data.
3. Review and polish the mobile UI.
4. Configure local PostgreSQL and the pg database client
5. Create the database schema.
6. Import gym equipment inventory.
7. Add exercises and equipment relationships.
8. Add workout and nutrition templates.
9. Add database persistence.
10. Add authentication.
11. Add AI integration.
12. Add validation, testing and production preparation.

Do not skip directly to AI integration.

# SECURITY

- Never print secrets.
- Never commit .env or .env.local.
- Keep a safe .env.example containing variable names without values.
- Never expose DATABASE_URL to client-side code.
- Never use a NEXT_PUBLIC_ prefix for database credentials or secrets.
- Never store plain-text passwords.
- Do not add unrestricted administrative endpoints.
- Do not execute destructive database operations without explicit
  approval.

# QUALITY

After meaningful code changes:

- run npm run lint
- fix errors instead of suppressing them

Before completing a major milestone:

- run npm run build
- report any remaining errors or warnings honestly

When completing a task:

- summarize the files created or changed
- explain how to review the result
- state what remains unfinished
- keep changes focused on the requested milestone

# CURRENT MILESTONE

The current milestone remains frontend UI with mock data.

Build:

- the mobile-first client UI foundation
- the desktop-first admin UI foundation

Do not:

- connect PostgreSQL
- install pg
- create database tables
- implement authentication
- integrate AI

For this task, create only AGENTS.md.

Do not modify any other application files.
