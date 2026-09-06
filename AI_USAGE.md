# AI Usage Disclosure

## Tools Used
- Gemini 3.1 Pro (via Antigravity IDE)

## How AI Was Used
- **Project Scaffolding**: AI assisted in generating the boilerplate code for the Express server, TypeScript configuration, and Prisma schema.
- **Endpoint Implementation**: I used AI to write the boilerplate for Express routes and Zod validation schemas.
- **Testing**: AI helped quickly generate the automated tests using Jest and Supertest.
- **API Documentation**: AI generated the Swagger JSDoc annotations based on the provided schemas and endpoints.

## Verification & Manual Changes
- **Database Choice**: The initial plan was to use Docker and PostgreSQL. However, the AI encountered an issue with the local Docker daemon. I reviewed the assignment requirements which explicitly allowed SQLite if documented, and instructed the AI to pivot to SQLite for easier evaluation. I manually verified the Prisma schema changes and `.env` setup.
- **Task Deletion Authorization**: The AI initially forgot to add the `creator_id` to the `Task` model in Prisma, which is required to allow the "task creator" to delete the task as per the requirements. I caught this missing detail, updated the Prisma schema, and adjusted the authorization logic in `src/routes/tasks.ts`.

## Incorrect/Insufficient AI Suggestion
- The AI initially suggested trying to start PostgreSQL via `docker-compose` without checking if Docker was installed and running on the host system. When it failed, it required manual intervention to decide whether to debug Docker or pivot to an allowed alternative (SQLite) to save time and meet the assignment's simplicity requirements.
- The AI initially generated an implementation plan that didn't specify who created the task (it only had assignee), missing the authorization requirement that the "task creator" can delete the task. I had to manually instruct it to add `creator_id` to the database schema.
