# Rona ERP: Monorepo

This is the mono-repo including all the workspaces (apps and packages) of the rona-erp project.

## Repository structure

apps:

- `apps/client`: The client-side font-end web-app and size of the project
  contains: Next.js, Shadcn-ui, @tanstack, ...
- `apps/server`: The primary server back-end api of the project including database
  contains: Nest.js, drizzle(postgres), ...

packages: (Shared between different app workspaces)

- `packages/config`: Configuration data
- `packages/types`: Schema Types, DTO types
- `packages/validation`: Form Schema validations, DTO Schema, SearchParams schemas
- `packages/routes`: Api Routes data (with Methods, Body, Response, SearchParams details as comments)
