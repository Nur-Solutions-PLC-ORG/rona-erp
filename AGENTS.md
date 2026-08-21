# Rona : AI Instructions

## ESSENTIAL: Always do first.

Read all `README.md` files to get the context on the repo. You will look there the tech-stack, architectural decisions and workspace specific rules.

## Before Making Changes

1. Understand the existing implementation.
2. Find the closest relevant `README.md`.
3. Follow existing patterns before introducing new ones.
4. Do not refactor unrelated code.

## Important Rules

- Do not access the database directly from the frontend. (in this case `apps/client`)
- Database operations belong to the backend. (in this case `apps/server`)
- Shared types, config data, validations and routes goes to `packages`.
- Follow existing API conventions.
- Do not introduce a new library when an existing project dependency solves the problem.
