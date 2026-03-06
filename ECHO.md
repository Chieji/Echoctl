# ECHO.md - Project Context Template

This file defines project-specific context for Echo CLI.
When Echo runs in a directory containing this file, it automatically loads these settings.

---

## Project Name
My Awesome Project

## Description
A brief description of what this project does and what problem it solves.

## Tech Stack
- TypeScript
- Node.js
- React
- PostgreSQL
- Docker

## Project Rules
- Always use TypeScript for new files
- Write tests for all new functions
- Use conventional commits
- No console.log in production code
- Use async/await instead of raw promises
- Prefer composition over inheritance

## Coding Standards
- Use 2 spaces for indentation
- Max line length: 100 characters
- Use single quotes for strings
- Semicolons required
- Trailing commas in multi-line objects
- PascalCase for classes and types
- camelCase for variables and functions
- UPPER_CASE for constants

## Custom Instructions
When helping with this project:
1. First understand the existing code structure
2. Suggest minimal changes that fit existing patterns
3. Always consider security implications
4. Prefer readability over cleverness
5. Explain the "why" behind suggestions

## Environment
- Node version: 20+
- Package manager: npm
- Database: PostgreSQL 15
- Deployment: Docker + Kubernetes

## Architecture Notes
- Frontend: React 18 with TypeScript
- Backend: Node.js with Express
- Database: PostgreSQL with Prisma ORM
- Caching: Redis for sessions
- Queue: Bull for background jobs

## Testing
- Unit tests: Jest
- Integration tests: Supertest
- E2E tests: Playwright
- Coverage target: 80%

## API Conventions
- RESTful endpoints
- JSON request/response
- JWT authentication
- Rate limiting: 100 req/min
- Versioning: /api/v1/...

## File Structure
```
src/
├── controllers/    # Request handlers
├── services/       # Business logic
├── models/         # Database models
├── middleware/     # Express middleware
├── utils/          # Helper functions
├── types/          # TypeScript types
└── index.ts        # Entry point
```

## Common Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm test         # Run tests
npm run lint     # Run linter
npm run format   # Format code
```

## Deployment
- CI/CD: GitHub Actions
- Registry: Docker Hub
- Hosting: AWS ECS
- Monitoring: CloudWatch + Sentry

---

**Echo will automatically apply these rules when working in this project.**

_To customize, edit this file. Echo reads it on every invocation._
