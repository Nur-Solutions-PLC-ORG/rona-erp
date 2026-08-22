# Apps: Server

This is the rona-erp primary server app (api, back-end)

Built In: Nest.js

## Features

- Uses zod schemas and types as DTO (instead of the legacy nestjs dto)

## Tools

- Nest.js for Framework
- Drizzle for ORM (w/Drizzle Kit)
- Neon Postgres for database
- Upstash redis for caching
- bcrypt for encryptions
- jsonwebtoken for JWT tokens
- Cookie parser for managing cookies
- Google Auth Library for Google O-auth
- Resend for emails

## Architecture

- Global configs, db, emails, exceptions, google, redis... etc goes to their respective directories inside of `src`
- `src/modules` includes layered separated Nestjs logic (.controller, .service, .repository...) for each feature
- `src/modules/feature` contains features for each of the modules under their own directories. (example, admin modules features goes to 'src/modules/features/admin/')
- For each feature/module create the essentials like controllers, services, modules, repositories, exceptions. NOTE: Don't create directories for each unless its needed. Single Files are enough for most cases
