# Campus Facility Booking System
### CPEN 412 Project — MVC Architecture

A full-stack web application for booking campus facilities (labs, study rooms, sports halls, auditoriums). Built with **Node.js/Express** (backend) and **React** (frontend) following the **MVC (Model-View-Controller)** architectural pattern.

---

## MVC Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      MVC Architecture                           │
│                                                                 │
│  Browser (React)           Backend (Express)                    │
│  ┌─────────────┐           ┌──────────────────────────────┐    │
│  │   VIEW      │  HTTP/    │  ROUTES  →  CONTROLLERS       │   │
│  │  (React     │  REST API │  (routes/) → (controllers/)   │   │
│  │  Components)│  ◄────►  │              ↓                │   │
│  │  Pages/     │           │           MODELS              │   │
│  │  Components │           │          (models/)            │   │
│  └─────────────┘           │              ↓                │   │
│                             │         PostgreSQL DB         │   │
│                             └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

| Layer | Location | Responsibility |
|-------|----------|----------------|
| **Model** | `backend/models/` | Database queries, business logic (conflict detection) |
| **View** | `frontend/src/` | React components, pages, UI rendering |
| **Controller** | `backend/controllers/` | Request handling, validation, response formatting |
| **Routes** | `backend/routes/` | URL → Controller mapping |
| **Middleware** | `backend/middleware/` | JWT auth, input validation |

---

## Project Structure

```
campus-booking-system/
├── backend/
│   ├── config/
│   │   └── database.js         ← DB connection pool & schema init
│   ├── controllers/
│   │   ├── authController.js   ← Register, login, profile
│   │   ├── bookingController.js← CRUD + conflict prevention
│   │   ├── facilityController.js
│   │   └── availabilityController.js ← 30-min slot grid
│   ├── middleware/
│   │   ├── auth.js             ← JWT protect + restrictTo(roles)
│   │   └── validation.js       ← express-validator rule sets
│   ├── models/
│   │   ├── User.js             ← User DB operations + bcrypt
│   │   ├── Facility.js         ← Facility CRUD + filtering
│   │   └── Booking.js          ← Booking CRUD + conflict detection
│   ├── routes/
│   │   ├── auth.js
│   │   ├── facilities.js
│   │   ├── bookings.js
│   │   └── availability.js
│   ├── scripts/
│   │   └── seed.js             ← Sample data seeder
│   ├── utils/
│   │   └── emailService.js     ← Nodemailer notifications
│   ├── server.js               ← Express app bootstrap
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── FacilityCard.jsx
│   │   │   ├── BookingForm.jsx  ← 2-step booking with slot grid
│   │   │   ├── BookingHistory.jsx
│   │   │   ├── AvailabilityGrid.jsx ← 30-min slot visualisation
│   │   │   └── AdminPanel.jsx   ← Approve/reject + facility mgmt
│   │   ├── context/
│   │   │   └── AuthContext.jsx  ← JWT state, login/logout/register
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── FacilitiesPage.jsx
│   │   │   ├── BookingPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── AdminPage.jsx
│   │   ├── services/
│   │   │   └── api.js          ← Axios instance + named helpers
│   │   ├── App.jsx             ← Routing + protected routes
│   │   └── index.css           ← Global design system
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## Quick Start

### Prerequisites
- Node.js ≥ 18
- PostgreSQL ≥ 14
- npm or yarn

### 1 — Clone & install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2 — Configure environment

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env → fill in DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET

# Frontend
cd ../frontend
cp .env.example .env
# VITE_API_URL defaults to /api (proxied via Vite) — no change needed for local dev
```

### 3 — Create the database

```sql
-- In psql or pgAdmin:
CREATE DATABASE campus_booking;
```

The server automatically creates all tables on first start.

### 4 — Seed sample data

```bash
cd backend
npm run seed
```

**Demo accounts created:**

| Role    | Email                 | Password    |
|---------|-----------------------|-------------|
| Admin   | admin@campus.edu      | Admin1234   |
| Faculty | alice@campus.edu      | Faculty123  |
| Student | dave@student.edu      | Student123  |

### 5 — Run the application

```bash
# Terminal 1 — Backend API (port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend React (port 5173)
cd frontend
npm run dev
```

Open **http://localhost:5173**

---

## API Reference

### Authentication
| Method | Endpoint           | Auth | Description |
|--------|--------------------|------|-------------|
| POST   | /api/auth/register | –    | Register new user |
| POST   | /api/auth/login    | –    | Login, returns JWT |
| GET    | /api/auth/me       | JWT  | Get current user |
| PUT    | /api/auth/profile  | JWT  | Update profile |
| GET    | /api/auth/users    | Admin| List all users |

### Facilities
| Method | Endpoint             | Auth  | Description |
|--------|----------------------|-------|-------------|
| GET    | /api/facilities      | –     | List all (supports ?search, ?type, ?minCapacity) |
| GET    | /api/facilities/:id  | –     | Get one |
| POST   | /api/facilities      | Admin | Create |
| PUT    | /api/facilities/:id  | Admin | Update |
| DELETE | /api/facilities/:id  | Admin | Soft-delete |

### Bookings
| Method | Endpoint          | Auth | Description |
|--------|-------------------|------|-------------|
| GET    | /api/bookings     | JWT  | List (users see own; admins see all) |
| GET    | /api/bookings/:id | JWT  | Get one |
| POST   | /api/bookings     | JWT  | Create (conflict check included) |
| PUT    | /api/bookings/:id | JWT  | Update / approve / reject |
| DELETE | /api/bookings/:id | JWT  | Cancel |

### Availability
| Method | Endpoint               | Auth | Description |
|--------|------------------------|------|-------------|
| GET    | /api/availability      | –    | 30-min slot grid for date |
| GET    | /api/availability/week | –    | 7-day availability summary |

---

## Key Features

### Double-Booking Prevention
The `BookingModel.checkConflicts()` method uses Allen's interval-overlap algorithm:
```sql
WHERE b.start_time < $4 AND b.end_time > $3
```
Any overlap (including edge cases) is detected before a booking is created or updated.

### Booking Approval Workflow
- Facilities with `requires_approval = true` create bookings with `status = 'pending'`
- Admins approve/reject via the Admin Panel or `PUT /api/bookings/:id`
- Email notifications sent on status changes

### 30-Minute Slot Grid
The `AvailabilityGrid` component fetches slots from `/api/availability` and renders a colour-coded grid:
- 🟢 Available (clickable)
- 🔴 Confirmed
- 🟡 Pending

---

## Deployment (Render / Railway)

### Backend
1. Create a new **Web Service** pointing to the `backend/` folder
2. Build command: `npm install`
3. Start command: `npm start`
4. Add environment variables from `.env.example`
5. Provision a **PostgreSQL** add-on; paste the connection URL into `DATABASE_URL` **or** individual `DB_*` vars

### Frontend
1. Create a new **Static Site** pointing to `frontend/`
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Set `VITE_API_URL` to your deployed backend URL + `/api`

---

## Extra Features Implemented

| Feature | Status |
|---------|--------|
| JWT Authentication | ✅ |
| Role-based access (student/faculty/admin) | ✅ |
| Admin approval workflow | ✅ |
| Email notifications (nodemailer) | ✅ |
| 30-min slot availability visualisation | ✅ |
| Search & filter (type, capacity, keyword) | ✅ |
| Booking conflict visualisation | ✅ |
| Weekly availability calendar | ✅ |
| Responsive UI | ✅ |
| Sample data seeder | ✅ |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend framework | Express.js 4 |
| Database | PostgreSQL 14+ via `pg` |
| Authentication | JSON Web Tokens (jsonwebtoken) |
| Password hashing | bcryptjs |
| Validation | express-validator |
| Email | nodemailer |
| Frontend framework | React 18 |
| Routing | React Router v6 |
| HTTP client | Axios |
| Build tool | Vite 5 |
| Date utilities | date-fns |
