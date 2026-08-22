# Apps: Client

This is the primary client-side web of the rona-erp project (web-app and website).

Built In: Next.js

## Tools

- Typescript as Language
- Next.js for Framework
- Tailwindcss for styling
- Shadcn for components
- React Query for queries and states
- Zod for schemas
- Zustand for stores

## Architecture

- Global Api configs, components, hooks, lib, store... etc goes to their respective directories inside of `src`
- `src/modules` includes modular components and logic (api, lib, store, hooks...) for each feature
- `src/modules/feature` contains features for each of the modules under their own directories. (example, admin modules features goes to 'src/modules/features/admin/')
- Directories inside of `src/modules` follow the same structure as `src` (components, hooks, api) but ONLY IF THERE are each requires multiple files other that that just single file is enough (hooks.ts, lib.ts, api.ts).
- NOTE: If there is only one file like 'hooks.ts', 'lib.ts', 'api.ts', or 'hooks/index.ts', 'api/index.ts'. then it is not necessary to create a directory for it.
