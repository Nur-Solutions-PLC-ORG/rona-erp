# Rona ERP: Monorepo

This is the mono-repo including all the workspaces (apps and packages) of the rona-erp project.

Here is the general Outline of the project infrastructure

apps:

- client: The client-side font-end web-app and size of the project
  contains: Next.js, Shadcn-ui, @tanstack, ...
- server: The primary server back-end api of the project
  contains: Nest.js, drizzle(postgres), ...

packages:

- @rona/config: All data
- @rona/database: All database schema and migrations with drizzle
- @rona/types: All types
- @rona/validation: All zod schema validations
- @rona/routes: All routes data
