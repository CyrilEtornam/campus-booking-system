# Campus Facility Booking System
### CPEN 421 Project — MVC Architecture

A full-stack web application for booking campus facilities (labs, study rooms, sports halls, auditoriums). Built with **Java 21 / Spring Boot 3** (backend) and **React 18** (frontend) following the **MVC (Model-View-Controller)** architectural pattern.

---

## MVC Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         MVC Architecture                             │
│                                                                      │
│  Browser (React)              Backend (Spring Boot)                  │
│  ┌─────────────┐              ┌────────────────────────────────┐    │
│  │   VIEW      │   HTTP/      │  @RestController  →  @Service   │   │
│  │  (React     │   REST API   │  (controller/)  →  (service/)   │   │
│  │  Components)│   ◄──────►  │                    ↓            │   │
│  │  Pages /    │              │               @Repository        │   │
│  │  Components │              │              (repository/)       │   │
│  └─────────────┘              │                    ↓            │   │
│                                │            PostgreSQL DB         │   │
│                                │          (JPA / Hibernate)       │   │
│                                └────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

| Layer | Location | Responsibility |
|-------|----------|----------------|
| **Model** | `entity/`, `repository/` | JPA entities, Spring Data repositories, conflict detection |
| **View** | `frontend/src/` | React components, pages, UI rendering |
| **Controller** | `controller/` | `@RestController` classes — request handling, response formatting |
| **Service** | `service/` | Business logic, validation, email notifications |
| **Security** | `security/`, `config/SecurityConfig` | JWT filter, Spring Security, role-based access |
| **DTO** | `dto/request/`, `dto/response/` | Request/response payload objects |
| **Exception** | `exception/` | `@ControllerAdvice` global error handler |

---

## Project Structure

```
campus-booking-system/
├── backend/                                   ← Spring Boot 3 / Java 21
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/campus/booking/
│       │   ├── BookingSystemApplication.java  ← @SpringBootApplication entry point
│       │   ├── config/
│       │   │   └── SecurityConfig.java        ← Spring Security + CORS config
│       │   ├── controller/
│       │   │   ├── AuthController.java        ← Register, login, profile, user list
│       │   │   ├── BookingController.java     ← Booking CRUD + approve/reject
│       │   │   ├── FacilityController.java    ← Facility CRUD
│       │   │   ├── AvailabilityController.java← 30-min slot grid + weekly view
│       │   │   └── HealthController.java      ← GET /api/health
│       │   ├── service/
│       │   │   ├── AuthService.java
│       │   │   ├── BookingService.java        ← Conflict detection logic
│       │   │   ├── FacilityService.java
│       │   │   ├── AvailabilityService.java
│       │   │   └── EmailService.java          ← Spring Mail notifications
│       │   ├── entity/
│       │   │   ├── User.java                  ← @Entity with Role enum
│       │   │   ├── Facility.java
│       │   │   ├── Booking.java               ← @Entity with Status enum
│       │   │   ├── BookingStatusConverter.java
│       │   │   └── UserRoleConverter.java
│       │   ├── repository/
│       │   │   ├── UserRepository.java        ← Spring Data JPA
│       │   │   ├── FacilityRepository.java
│       │   │   └── BookingRepository.java
│       │   ├── dto/
│       │   │   ├── request/                   ← LoginRequest, RegisterRequest,
│       │   │   │                                 BookingRequest, FacilityRequest,
│       │   │   │                                 UpdateBookingRequest, UpdateProfileRequest
│       │   │   └── response/                  ← AuthResponse, BookingResponse,
│       │   │                                     FacilityResponse, UserResponse, SlotDto
│       │   ├── security/
│       │   │   ├── JwtTokenProvider.java      ← JJWT token creation/validation
│       │   │   ├── JwtAuthenticationFilter.java
│       │   │   └── UserDetailsServiceImpl.java
│       │   ├── exception/
│       │   │   ├── GlobalExceptionHandler.java← @ControllerAdvice
│       │   │   ├── BadRequestException.java
│       │   │   ├── ConflictException.java
│       │   │   └── ResourceNotFoundException.java
│       │   └── scripts/
│       │       └── DataSeeder.java            ← CommandLineRunner (profile: seed)
│       └── resources/
│           ├── application.properties         ← Main config (env-var driven)
│           └── application-local.properties   ← Local dev overrides
│
├── frontend/                                  ← React 18 / Vite 5
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx                            ← Routing + protected routes
│       ├── index.css                          ← Global design system
│       ├── components/
│       │   ├── Header.jsx
│       │   ├── FacilityCard.jsx
│       │   ├── BookingForm.jsx                ← 2-step booking with slot grid
│       │   ├── BookingHistory.jsx
│       │   ├── AvailabilityGrid.jsx           ← 30-min slot visualisation
│       │   ├── AdminPanel.jsx                 ← Approve/reject + facility mgmt
│       │   ├── Modal.jsx
│       │   └── SkeletonLoader.jsx
│       ├── context/
│       │   ├── AuthContext.jsx                ← JWT state, login/logout/register
│       │   └── ThemeContext.jsx
│       ├── pages/
│       │   ├── HomePage.jsx
│       │   ├── FacilitiesPage.jsx
│       │   ├── BookingPage.jsx
│       │   ├── DashboardPage.jsx
│       │   ├── LoginPage.jsx
│       │   ├── RegisterPage.jsx
│       │   └── AdminPage.jsx
│       └── services/
│           └── api.js                         ← Axios instance + named helpers
│
└── README.md
```

---

## Quick Start

### Prerequisites
- Java 21+
- Maven 3.9+
- PostgreSQL 14+
- Node.js 18+ and npm (frontend only)

### 1 — Create the database

```sql
-- In psql or pgAdmin:
CREATE DATABASE campus_booking;
```

Hibernate (`spring.jpa.hibernate.ddl-auto=update`) creates all tables automatically on first start.

### 2 — Configure the backend

All settings are driven by environment variables with sensible defaults. For local development, edit `backend/src/main/resources/application-local.properties` or export variables before running:

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `campus_booking` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `1234` | Database password |
| `JWT_SECRET` | *(insecure default)* | Secret key — **change in production** |
| `JWT_EXPIRES_MS` | `604800000` | Token TTL (7 days) |
| `ADMIN_SECRET` | `admin-secret-change-me` | Required to register an admin account |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed CORS origin |
| `EMAIL_USER` | *(empty)* | SMTP username — leave blank to disable email |
| `EMAIL_PASS` | *(empty)* | SMTP password |
| `EMAIL_ENABLED` | `false` | Set to `true` to send real emails |

### 3 — Seed sample data

The seeder runs when the `seed` Spring profile is active:

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=seed
```

**Demo accounts created:**

| Role    | Email                | Password   |
|---------|----------------------|------------|
| Admin   | admin@campus.edu     | Admin1234  |
| Faculty | alice@campus.edu     | Faculty123 |
| Faculty | bob@campus.edu       | Faculty123 |
| Faculty | carol@campus.edu     | Faculty123 |
| Student | dave@student.edu     | Student123 |
| Student | eve@student.edu      | Student123 |
| Student | frank@student.edu    | Student123 |
| Student | grace@student.edu    | Student123 |

### 4 — Run the application

```bash
# Terminal 1 — Backend API (port 5000)
cd backend
mvn spring-boot:run

# Terminal 2 — Frontend (port 5173)
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

---

## API Reference

### Authentication
| Method | Endpoint            | Auth  | Description |
|--------|---------------------|-------|-------------|
| POST   | /api/auth/register  | –     | Register new user |
| POST   | /api/auth/login     | –     | Login, returns JWT |
| GET    | /api/auth/me        | JWT   | Get current user |
| PUT    | /api/auth/profile   | JWT   | Update profile |
| GET    | /api/auth/users     | Admin | List all users |

### Facilities
| Method | Endpoint              | Auth  | Description |
|--------|-----------------------|-------|-------------|
| GET    | /api/facilities       | –     | List all (supports `?search`, `?type`, `?minCapacity`) |
| GET    | /api/facilities/:id   | –     | Get one |
| POST   | /api/facilities       | Admin | Create |
| PUT    | /api/facilities/:id   | Admin | Update |
| DELETE | /api/facilities/:id   | Admin | Soft-delete |

### Bookings
| Method | Endpoint           | Auth  | Description |
|--------|--------------------|-------|-------------|
| GET    | /api/bookings      | JWT   | List (users see own; admins see all) |
| GET    | /api/bookings/:id  | JWT   | Get one |
| POST   | /api/bookings      | JWT   | Create (conflict check included) |
| PUT    | /api/bookings/:id  | JWT   | Update / approve / reject |
| DELETE | /api/bookings/:id  | JWT   | Cancel |

### Availability
| Method | Endpoint                | Auth | Description |
|--------|-------------------------|------|-------------|
| GET    | /api/availability       | –    | 30-min slot grid for a date |
| GET    | /api/availability/week  | –    | 7-day availability summary |

### Health
| Method | Endpoint     | Auth | Description |
|--------|--------------|------|-------------|
| GET    | /api/health  | –    | Liveness check |

---

## Key Features

### Double-Booking Prevention
`BookingService` uses Allen's interval-overlap algorithm via a JPQL query before persisting any booking:
```sql
WHERE b.startTime < :endTime AND b.endTime > :startTime
  AND b.facility = :facility
  AND b.status <> 'CANCELLED'
```
Any overlap (including edge cases) raises a `ConflictException` (HTTP 409).

### Booking Approval Workflow
- Facilities with `requiresApproval = true` create bookings with `status = PENDING`
- Admins approve/reject via the Admin Panel or `PUT /api/bookings/:id`
- `EmailService` (Spring Mail) sends notifications on status changes when `EMAIL_ENABLED=true`

### 30-Minute Slot Grid
`AvailabilityController` returns a list of `SlotDto` objects. The `AvailabilityGrid` React component renders a colour-coded grid:
- 🟢 Available (clickable)
- 🔴 Confirmed
- 🟡 Pending

---

## Deployment (Render / Railway)

### Backend
1. Create a new **Web Service** pointing to the `backend/` folder
2. Build command: `mvn package -DskipTests`
3. Start command: `java -jar target/booking-system-1.0.0.jar`
4. Set all environment variables listed in the **Configure the backend** section above
5. Provision a **PostgreSQL** add-on and set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

### Frontend
1. Create a new **Static Site** pointing to `frontend/`
2. Build command: `npm install && npm run build`
3. Publish directory: `dist`
4. Set `VITE_API_URL` to your deployed backend URL + `/api`

---

## Extra Features Implemented

| Feature | Status |
|---------|--------|
| JWT Authentication | ✅ |
| Role-based access (student / faculty / admin) | ✅ |
| Admin approval workflow | ✅ |
| Email notifications (Spring Mail) | ✅ |
| 30-min slot availability visualisation | ✅ |
| Search & filter (type, capacity, keyword) | ✅ |
| Booking conflict detection & visualisation | ✅ |
| Weekly availability calendar | ✅ |
| Responsive UI | ✅ |
| Sample data seeder (`seed` profile) | ✅ |
| Global exception handler (`@ControllerAdvice`) | ✅ |
| Snake_case JSON serialisation (frontend compat) | ✅ |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend language | Java 21 |
| Backend framework | Spring Boot 3.2 |
| ORM | Spring Data JPA / Hibernate 6 |
| Database | PostgreSQL 14+ |
| Authentication | Spring Security + JJWT 0.12 |
| Validation | Spring Bean Validation (Jakarta) |
| Email | Spring Mail (SMTP) |
| Build tool | Maven 3 |
| Boilerplate reduction | Lombok |
| Frontend framework | React 18 |
| Routing | React Router v6 |
| HTTP client | Axios |
| Frontend build | Vite 5 |
| Date utilities | date-fns 3 |
