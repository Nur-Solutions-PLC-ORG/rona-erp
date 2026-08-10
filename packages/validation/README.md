# Package: @rona/validation

This package contains all the zod schema validations for the rona-erp monorepo. It also acts as a DTO

## Rules

- Use camelCase for naming: Capitalize the first letter of every word except the first word.(eg. userSchema)
- Always ends with 'Schema' (eg. loginSchema) for schemas and 'Dto' for dto
- All types for every schema and dto goes to "@rona/types" not here. It is prohibited
- Never add '.default()' to any zod schema.
