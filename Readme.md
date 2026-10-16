# Study Dashboard

A full-stack academic planner for students and teachers. Students can manage attendance, routine, tasks, study sessions, GPA, calendar events, and archive records. Teachers can manage assigned-class routines, attendance, audit history, and at-risk analytics.

Live app ->  https://attendance-tracker-pi-blue.vercel.app


This project started as a simple vanilla JavaScript app using localStorage to track attendance in the browser. It was later rebuilt into a full-stack application with a React frontend and an Express/MongoDB backend, so attendance data is tied to a user account and persists across devices instead of being stuck in one browser.

# Features

- JWT Bearer authentication with student and teacher roles
- Student routine, attendance, tasks, study sessions, GPA, calendar, notifications, and archive
- Teacher class attendance, roster, routine, audit history, and attendance-risk analytics
- Attendance totals that exclude cancelled sessions and preserve teacher-marked session ownership

# Tech Stack

Frontend
- React (Vite)
- Axios
->Deployed on Vercel

Backend
- Node.js / Express
- MongoDB with Mongoose
- JWT authentication via `Authorization: Bearer <token>`
- bcryptjs for password hashing
->Deployed on Render

Database
-> MongoDB Atlas

# Local setup

1. Install dependencies in each app: `cd backend && npm install`, then `cd frontend && npm install`.
2. Create `backend/.env` with:

   ```env
   MONGO_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER/DATABASE
   JWT_SECRET=replace-with-a-long-random-secret
   PORT=5000
   # Optional, comma-separated additional frontend origins
   CLIENT_ORIGIN=https://your-frontend.example.com
   ```

3. Start the API with `cd backend && npm run dev` (default: `http://localhost:5000`).
4. Start the frontend with `cd frontend && npm run dev` (default: `http://localhost:5173`). Set `VITE_API_URL` for a deployed API; it defaults to `http://localhost:5000` locally.

# Authentication and data notes

1. A user registers with a username and password. The password is hashed with bcrypt before being stored.
2. On login, the server returns a seven-day JWT. The frontend stores it in localStorage and Axios sends it in the Authorization Bearer header for protected requests.
3. Every protected route verifies the JWT and scopes records to the authenticated user. Teacher endpoints additionally enforce the teacher role and class assignment.
4. Attendance is stored as daily subject records. Teacher marks are scoped to a class session; teacher marks take precedence over a matching legacy self entry and cannot be changed by a later self-save.

Because the token is stored in localStorage, it is vulnerable to an XSS compromise. Do not render untrusted HTML, keep dependencies current, and consider a complete cookie-based redesign only if frontend, CORS, and CSRF protections are changed together.

# Scripts

- `backend: npm test` runs attendance calculation tests.
- `backend: npm start` starts the API.
- `frontend: npm run lint` runs ESLint.
- `frontend: npm run build` builds the production frontend.

# Deployment

Deploy the frontend to Vercel (or another static host) with `VITE_API_URL` set to the API origin. Deploy the backend with `MONGO_URI`, `JWT_SECRET`, and `CLIENT_ORIGIN` configured. Add the deployed frontend origin to CORS through `CLIENT_ORIGIN`.

# Known limitations

- Existing historical teacher entries without a class identifier remain readable but cannot be reliably separated by class until they are corrected through the teacher attendance workflow.
- No production migration is included; this preserves existing attendance history without destructive rewrites.
