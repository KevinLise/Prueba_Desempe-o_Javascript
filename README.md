# Workspace Reservation System

## Project Name

**Workspace Reservation System** — A Single Page Application (SPA) for managing workspace reservations within a company.

---

## Description

A web application that allows employees to book shared workspaces such as meeting rooms, private offices, coworking areas, and auditoriums. The system handles two roles: administrators who manage all reservations and spaces, and regular users who can create and manage their own reservations.

---

## Technologies Used

- JavaScript ES6+
- Vite 5
- TailwindCSS 3
- JSON Server 0.17
- Concurrently 8
- Axios 1.6
- HTML5 / CSS3

---

## Installation

Clone or download the project, then install dependencies:

```bash
npm install
```

---

## Running the Project

Starts both the Vite dev server and JSON Server simultaneously:

```bash
npm run dev
```

- Frontend available at: `http://localhost:5173`
- API available at: `http://localhost:3000`

---

## Running JSON Server

To run only the mock API:

```bash
npm run server
```

JSON Server reads from `db.json` and exposes the following endpoints:

- `GET/POST /users`
- `GET/POST/PUT/PATCH/DELETE /spaces`
- `GET/POST/PUT/PATCH/DELETE /reservations`

---

## Test Users

| Role  | Email           | Password  |
|-------|-----------------|-----------|
| Admin | admin@test.com  | Admin123* |
| User  | user@test.com   | User123*  |
| User  | user2@test.com  | User123*  |

---

## Project Structure

```
├── db.json                          # Mock database (users, spaces, reservations)
├── index.html                       # Single HTML entry point
├── package.json
├── vite.config.js                   # Vite config with /api proxy to port 3000
└── src/
    ├── main.js                      # App entry point — initializes router and auth guard
    ├── router.js                    # SPA router using History API with auth/role guards
    ├── style.css                    # TailwindCSS base + custom component classes
    ├── services/
    │   ├── api.js                   # Axios instance with endpoints for all resources
    │   └── auth.js                  # Login, logout, session persistence via localStorage
    └── views/
        ├── login.js                 # Login form view
        ├── dashboard.js             # Admin dashboard with reservation statistics
        ├── reservations.js          # Reservations list with full CRUD and status actions
        ├── spaces.js                # Workspace spaces management (admin only)
        └── components/
            └── navbar.js            # Reusable navigation bar component
```

---

## Role Permissions

### Admin
- View all reservations from all users
- Create, edit, and delete any reservation
- Approve or reject pending reservations
- Manage workspace spaces: create, edit, delete, and list
- Access the admin dashboard with statistics

### User
- Create new reservations (status starts as `pending`)
- View only their own reservations
- Edit their own reservations while status is `pending`
- Cancel their own reservations (when `pending` or `approved`)
- Cannot access administrative modules or other users' reservations

---

## Technical Decisions

- **History API routing**: Navigation uses `window.history.pushState` for clean URLs without a hash. A Vite proxy transparently redirects `/api/*` requests to `http://localhost:3000`.

- **Session persistence with localStorage**: After login, the user object (without password) is stored in `localStorage`. This allows the session to survive page refreshes. On logout, both keys are removed completely.

- **Route guards**: Each route in the router has `requiresAuth` and `adminOnly` flags. Before rendering any view, the router checks authentication and role. Unauthenticated users are redirected to `/login`. Users without admin role who try to access admin routes see an "Access Denied" message.

- **Business rule — no duplicate reservations**: Before creating or editing a reservation, the app fetches all existing reservations and checks for time overlap on the same space and date. Cancelled and rejected reservations are excluded from the check.

- **Modular view architecture**: Every view is a class with two methods — `render()` returns the HTML string, `mounted()` attaches all event listeners after the HTML is inserted into the DOM. This keeps logic and markup organized without a framework.

- **API service layer**: All HTTP calls go through a centralized Axios instance in `api.js`. The response interceptor extracts `response.data` automatically, so all API calls return the data directly.
