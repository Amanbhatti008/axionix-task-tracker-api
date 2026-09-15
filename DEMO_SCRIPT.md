# 🎥 Video Demonstration Script (5-8 Minutes)
### Axionix Team Task Tracker API
**Candidate:** Aman Bhatti  
**Role:** Backend Engineering Intern  

This guide provides a structured, professional, minute-by-minute script and screen walkthrough. Follow this while recording your screen using **Loom**, **OBS**, or any screen recorder.

---

## ⏱ Timeline Overview

| Section | Duration | Key Action on Screen |
| :--- | :--- | :--- |
| **1. Intro & Architecture** | 0:00 - 1:15 | Show VS Code project structure & `schema.prisma` |
| **2. Server Boot & Swagger Docs** | 1:15 - 2:15 | Run `npm run dev`, open `http://localhost:3000/api-docs` |
| **3. Authentication & Authorization** | 2:15 - 3:30 | Register user, Login, copy JWT token to Swagger Authorize |
| **4. Projects, Members & Tasks Lifecycle** | 3:30 - 5:15 | Create project, create task, change status to `DONE` (`completed_at`), filter tasks, view `/summary` |
| **5. Error Handling & Validation Edge Cases**| 5:15 - 6:00 | Trigger unauthorized / invalid input to show standardized `{ "error": ... }` |
| **6. Automated Test Suite** | 6:00 - 6:45 | Run `npm test` in terminal (10/10 tests passing) |
| **7. Engineering Decisions, Trade-offs & Wrap-up** | 6:45 - 7:45 | Explain SQLite decision, Task deletion auth fix, AI transparency |

---

## 🎙 Word-for-Word Script

### 1. Introduction & Architecture (0:00 - 1:15)
**Screen:** Show your IDE (VS Code) with the folder tree expanded.

> *"Hello everyone and the Axionix engineering evaluation team. My name is Aman Bhatti, and today I am excited to demonstrate my submission for the Team Task Tracker REST API.*
>
> *For this project, I chose a modern backend stack: **Node.js with Express and TypeScript**, utilizing **Prisma ORM** with **SQLite** for rapid local evaluation, and **Jest with Supertest** for automated integration testing.*
>
> *Looking at the repository structure, I followed a clean separation of concerns:*
> - *`src/routes`: defines our RESTful API endpoints for Auth, Projects, and Tasks.*
> - *`src/middlewares`: houses our JWT bearer verification and our centralized global error handler.*
> - *`prisma/schema.prisma`: maintains our relational schema with cascade deletes and constraints.*
> - *`tests/`: contains end-to-end integration test suites.*
> *Everything is configured with environment variables, Docker Compose support, and a complete GitHub Actions CI workflow."*

---

### 2. Server Boot & Swagger UI (1:15 - 2:15)
**Screen:** Open terminal, run `npm run dev`, then switch browser to `http://localhost:3000/api-docs`.

> *"Let's start the application in development mode with `npm run dev`.*
> *(Wait 2 seconds as the server logs start on port 3000)*
> *The server is up. I have integrated complete OpenAPI/Swagger documentation at `/api-docs`. As you can see, every single required endpoint across Authentication, Projects, Members, and Tasks is clearly documented with schemas and response types."*

---

### 3. Authentication Flow (2:15 - 3:30)
**Screen:** In Swagger UI, expand `POST /auth/register` and `POST /auth/login`.

> *"Let's test our authentication flow:*
> 1. *First, I'll register a new user under `POST /auth/register`. I input the name 'Aman Bhatti', email 'aman@example.com', and a secure password. We execute the request—and notice we get a `201 Created` status with the user payload, while the password is encrypted with bcrypt and strictly excluded from the response.*
> 2. *Next, we log in using `POST /auth/login`. We send the credentials and receive a `200 OK` response containing our signed JWT token.*
> 3. *I copy this token, scroll to the top of Swagger, click the **Authorize** button, and paste it with `Bearer <token>`.*
> *Now, all subsequent protected endpoints are unlocked."*

---

### 4. Projects, Tasks, and State Machine (3:30 - 5:15)
**Screen:** Demonstrate `/projects`, `/projects/{id}/tasks`, `/tasks/{id}`, and `/summary`.

> *"Now let's explore multi-tenant project management:*
> 1. *I create a project via `POST /projects` titled 'Axionix Backend Roadmap'. Notice the creator is automatically registered as the owner and first member.*
> 2. *Now, as a project member, I create a task via `POST /projects/{id}/tasks` with title 'Setup Docker Pipeline', priority 'HIGH', and an ISO-8601 due date. The task is created with default status `TODO` and `completed_at` as null.*
> 3. *Now, let's test our stateful lifecycle: I call `PATCH /tasks/{id}` and transition status to `DONE`. When I hit execute, observe that `completed_at` has been automatically populated with the current timestamp! If I switch it back to `IN_PROGRESS`, the `completed_at` field resets to null.*
> 4. *Next, let's look at filtering and pagination: we can fetch `GET /projects/{id}/tasks?status=DONE` to inspect completed tasks.*
> 5. *Finally, let's check `GET /projects/{id}/summary`. It returns real-time aggregated metrics—total task counts, grouped breakdown by status and priority."*

---

### 5. Error Handling & Validation Rules (5:15 - 6:00)
**Screen:** Execute a bad request (e.g. invalid password or unauthorized access).

> *"One critical requirement of this project was consistent error handling. Every error adheres to an immutable JSON shape:*
> *If I attempt to register with a duplicate email or provide an empty task title, the server returns a `400` or `409` with `{ "error": { "code": "...", "message": "..." } }`.*
> *Similarly, non-members or unauthenticated callers receive standardized `401 Unauthorized` or `403 Forbidden` responses."*

---

### 6. Automated Testing (6:00 - 6:45)
**Screen:** Switch to terminal and run `npm test`.

> *"Let's verify reliability through our automated test suite. I run `npm test`.*
> *(Wait for Jest to run and display green checkmarks)*
> *All 10 integration test cases pass seamlessly in under 3 seconds. This validates user registration, duplicate email guards, failed logins, authorization checks, task creation, the `completed_at` lifecycle, filtering, and summary aggregation."*

---

### 7. Design Decisions, Trade-offs & AI Disclosure (6:45 - 7:45)
**Screen:** Show `README.md` and `AI_USAGE.md`.

> *"To wrap up, I want to highlight a couple of key architectural decisions:*
> 1. ***Database Choice**: I leveraged Prisma with SQLite for frictionless evaluation. Any reviewer can clone the repo and immediately run `npm run dev` with zero container overhead. However, because Prisma handles data modeling, switching to PostgreSQL in production is a single-line configuration change.*
> 2. ***Task Deletion Authorization**: Per the assignment spec, only the project owner or original task creator can delete a task. During implementation, I ensured that `creator_id` is explicitly tracked on the task entity.*
> 3. ***AI Disclosure**: As documented in `AI_USAGE.md`, I used AI assistance for boilerplate generation and scaffolding. I personally verified all business logic, fixed the missing task creator schema design, and wrote custom authorization guards.*
>
> *Thank you for reviewing my work. I look forward to your feedback and discussing the solution further!"*

---

## 💡 Quick Tips for Recording
- Keep your browser zoomed to 110%–125% for high readability.
- Keep your terminal clear before running `npm test`.
- Use a headset microphone if possible for crisp audio.
- Loom allows you to record screen + webcam bubble in the corner.
