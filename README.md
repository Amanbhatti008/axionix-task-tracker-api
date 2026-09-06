# Axionix Team Task Tracker API

This is the backend implementation for the Axionix Team Task Tracker API, built with Node.js, Express, TypeScript, and Prisma (SQLite).

## Prerequisites

- Node.js (v18 or higher)
- npm

## Setup Instructions

1. **Clone the repository** (or navigate to the project directory).
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Environment Variables**:
   Copy `.env.example` to `.env`. It contains default values for local development.
   ```bash
   copy .env.example .env
   ```
4. **Database Setup**:
   The project uses SQLite for ease of setup and evaluation. Run the following command to create the database schema:
   ```bash
   npm run db:push
   ```

## Running the Application

To start the server in development mode:
```bash
npm run dev
```

The server will start on `http://localhost:3000`.

## API Documentation

Swagger API documentation is available at:
`http://localhost:3000/api-docs`

You can use this interface to test all available endpoints. Don't forget to register a user, login, and click the **Authorize** button in Swagger to enter your JWT token (format: `Bearer <token>`).

## Running Tests

To run the automated test suite (Jest + Supertest):
```bash
npm run test
```

## Assumptions and Limitations

- **Database**: The assignment allowed using SQLite if clearly documented. I have used SQLite as it avoids the need to have Docker Desktop running for PostgreSQL, ensuring a seamless evaluation experience. In a production environment, Prisma can easily be reconfigured to use PostgreSQL just by changing the provider in `schema.prisma`.
- **Enums**: SQLite does not natively support Enums. So, Prisma maps them as strings. Validation is handled at the application level via Zod.
- **Due Dates**: Past due dates are allowed (e.g. for logging tasks completed retrospectively or overdue tasks).
- **Task Deletion**: Only the task creator or project owner can delete a task.
- **Completed At**: Automatically set when a task's status is changed to `DONE`. It resets to null if the status is changed back to `TODO` or `IN_PROGRESS`.
