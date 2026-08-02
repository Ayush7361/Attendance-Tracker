# Attendance Dashboard

A full-stack MERN attendance tracker that lets a user set a weekly class schedule, log weekly attendance, and see monthly and overall attendance percentages all tied to their own account.

Live app ->  https://attendance-tracker-pi-blue.vercel.app


This project started as a simple vanilla JavaScript app using localStorage to track attendance in the browser. It was later rebuilt into a full-stack application with a React frontend and an Express/MongoDB backend, so attendance data is tied to a user account and persists across devices instead of being stuck in one browser.

# Features

- Username/password authentication (JWT stored in an httpOnly cookie)
- Set a recurring weekly class schedule (Mon–Sat)
- Log weekly attendance against that schedule, with validation (can't log more attended than scheduled)
- Per-month running totals: total classes, attended classes, attendance percentage
- Color-coded progress bar based on attendance percentage
- Overall summary across all months, with a month-by-month breakdown
- Clear a single month's data, or reset everything
- Data is private per user — each account only sees its own schedule and attendance

# Tech Stack

Frontend
- React (Vite)
- Axios
->Deployed on Vercel

Backend
- Node.js / Express
- MongoDB with Mongoose
- JWT authentication via httpOnly cookies
- bcryptjs for password hashing
->Deployed on Render

Database
-> MongoDB Atlas

# How It Works

1. A user registers with a username and password. The password is hashed with bcrypt before being stored.
2. On login, the server issues a JWT and sets it as an httpOnly cookie, so the frontend never handles the raw token directly.
3. Every request to a protected route (schedule, months) goes through an auth middleware that verifies the JWT and attaches the user's ID to the request.
4. The weekly schedule is stored as one document per user. Saving it upserts that document.
5. Each month's attendance is stored as one document per user per month, holding a running total and attended count. Adding a week increments both counts.
6. The frontend calculates attendance percentage and overall summary from the data returned by the backend.