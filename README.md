# WorkManager - Full Stack CRUD App

A full-stack web application with **Flask** backend and **React** frontend featuring:
- JWT Authentication (Access + Refresh tokens stored in **HttpOnly cookies only**)
- Role-Based Access Control (Employer / Employee)
- CRUD for Users (role-restricted) and Tasks (all users)
- **Zustand** state management
- Pure SQL queries (no ORM)

---

## Architecture

```
project/
├── backend/              # Flask API server (port 5000)
│   ├── app.py            # App entry + JWT config
│   ├── database.py       # SQLite init + connection
│   ├── requirements.txt
│   ├── .env
│   └── routes/
│       ├── auth.py       # /api/auth/* (login, signup, logout, refresh, /me)
│       ├── users.py      # /api/users/* (CRUD with role guards)
│       └── tasks.py      # /api/tasks/* (CRUD for all authenticated users)
│
└── frontend/             # React + Vite (port 5173)
    └── src/
        ├── api/axios.js          # Axios instance with auto token refresh
        ├── store/
        │   ├── authStore.js      # Zustand: user session
        │   ├── usersStore.js     # Zustand: users CRUD
        │   └── tasksStore.js     # Zustand: tasks CRUD
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── SignupPage.jsx
        │   ├── DashboardPage.jsx
        │   ├── UsersPage.jsx
        │   ├── TasksPage.jsx
        │   └── ProfilePage.jsx
        └── components/
            └── Layout.jsx        # Sidebar layout
```

---

## Role-Based Access Control

| Action                    | Employer | Employee |
|---------------------------|----------|----------|
| Sign up as employer        | ✅       | ✅       |
| Add new employee           | ✅       | ❌       |
| Edit own profile           | ✅       | ✅       |
| Edit their employees       | ✅       | ❌       |
| Delete their employees     | ✅       | ❌       |
| Create tasks               | ✅       | ✅       |
| Read tasks                 | ✅       | ✅       |
| Update tasks               | ✅       | ✅       |
| Delete tasks               | ✅       | ✅       |

---

## Token Strategy

- **Access token** (15 min): Sent via `access_token` HttpOnly cookie
- **Refresh token** (7 days): Sent via `refresh_token` HttpOnly cookie
- **No localStorage** - all tokens in cookies only
- Auto-refresh: Axios interceptor retries failed 401 requests after refreshing silently

---

## Setup & Run

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Server runs at: http://localhost:5000

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at: http://localhost:5173

---

## API Endpoints

### Auth
| Method | Endpoint            | Description              | Auth Required |
|--------|---------------------|--------------------------|---------------|
| POST   | /api/auth/signup    | Register new user        | No            |
| POST   | /api/auth/login     | Login (sets cookies)     | No            |
| POST   | /api/auth/logout    | Logout (clears cookies)  | No            |
| POST   | /api/auth/refresh   | Refresh access token     | Refresh cookie|
| GET    | /api/auth/me        | Get current user         | Yes           |

### Users
| Method | Endpoint            | Description              | Role          |
|--------|---------------------|--------------------------|---------------|
| GET    | /api/users/         | List users               | All           |
| GET    | /api/users/:id      | Get user by ID           | All           |
| POST   | /api/users/         | Create employee          | Employer only |
| PUT    | /api/users/:id      | Update user              | Own or employer's employee |
| DELETE | /api/users/:id      | Delete employee          | Employer only |

### Tasks
| Method | Endpoint            | Description              | Auth Required |
|--------|---------------------|--------------------------|---------------|
| GET    | /api/tasks/         | List all tasks           | Yes           |
| GET    | /api/tasks/:id      | Get task by ID           | Yes           |
| POST   | /api/tasks/         | Create task              | Yes           |
| PUT    | /api/tasks/:id      | Update task              | Yes           |
| DELETE | /api/tasks/:id      | Delete task              | Yes           |

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Backend    | Python 3.11+, Flask 3, flask-jwt-extended |
| Database   | SQLite (pure SQL, no ORM)           |
| Auth       | JWT (access + refresh), bcrypt      |
| Frontend   | React 18, Vite                      |
| Routing    | React Router v6                     |
| State      | Zustand                             |
| HTTP       | Axios with interceptors             |
| Styling    | Custom CSS                          |
