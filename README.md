# SplitZy - Smart Expense Splitting App

A full-stack expense splitting application built with FastAPI, MongoDB, and React.

## Project Structure

```
SplitZy/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI entry point
│   │   ├── config.py          # Settings (reads .env)
│   │   ├── database.py        # MongoDB connection
│   │   ├── models.py          # Pydantic schemas
│   │   ├── auth.py            # JWT + bcrypt auth
│   │   └── routers/
│   │       ├── auth.py        # /api/auth/*
│   │       ├── groups.py      # /api/groups/*
│   │       ├── expenses.py    # /api/groups/{id}/expenses/*
│   │       └── settlements.py # /api/groups/{id}/settlements/*
│   ├── requirements.txt
│   └── .env                   # ADD YOUR SECRETS HERE
│
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── contexts/          # Auth and Theme contexts
    │   ├── pages/             # Auth, Dashboard, GroupDetail, Settlements
    │   ├── components/        # Navbar, Logo, Modals
    │   └── services/          # Axios API client
    ├── package.json
    └── .env                   # ADD YOUR API URL HERE
```

## Prerequisites

### 1. Python (3.10+)
Download: https://www.python.org/downloads/
Verify: python --version

### 2. Node.js (v18+)
Download: https://nodejs.org/
Verify: node --version && npm --version

### 3. MongoDB
Option A - Local: Download from https://www.mongodb.com/try/download/community
It auto-starts as a Windows service on localhost:27017.

Option B - MongoDB Atlas (Free Cloud):
1. Sign up at https://cloud.mongodb.com
2. Create a free cluster
3. Copy the connection string (mongodb+srv://user:pass@cluster.mongodb.net/)

## Backend Setup

### Step 1: Navigate to backend
  cd d:\SplitZy\backend

### Step 2: Create virtual environment
  python -m venv venv

### Step 3: Activate virtual environment
PowerShell:
  .\venv\Scripts\Activate.ps1

If PowerShell blocks scripts, first run:
  Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

Command Prompt:
  venv\Scripts\activate.bat

You should see (venv) at the start of your prompt.

### Step 4: Install dependencies
  pip install -r requirements.txt

### Step 5: Configure .env
Open d:\SplitZy\backend\.env and set your values:

  SECRET_KEY=your_super_secret_key_change_this
  ALGORITHM=HS256
  ACCESS_TOKEN_EXPIRE_MINUTES=43200
  MONGODB_URL=mongodb://localhost:27017
  DATABASE_NAME=splitzy

Generate a strong SECRET_KEY with:
  python -c "import secrets; print(secrets.token_hex(32))"

### Step 6: Start the backend
  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

Expected output:
  Connected to MongoDB
  INFO:     Uvicorn running on http://0.0.0.0:8000

- API: http://localhost:8000
- Swagger docs: http://localhost:8000/docs

## Frontend Setup

### Step 1: Open a NEW terminal, go to frontend
  cd d:\SplitZy\frontend

### Step 2: Check frontend .env
d:\SplitZy\frontend\.env should contain:
  VITE_API_URL=http://localhost:8000

### Step 3: Install dependencies
  npm install

### Step 4: Start dev server
  npm run dev

App runs at: http://localhost:5173

## Running the App

You need TWO terminals simultaneously:
- Terminal 1 (backend): uvicorn app.main:app --reload
- Terminal 2 (frontend): npm run dev

Then open http://localhost:5173

## Features

- Authentication: JWT with bcrypt. Stays logged in 30 days.
- Dashboard: All groups with stats and quick actions.
- Groups: Create with custom title and members.
- Expenses: Add/edit/delete. Choose who paid and who splits.
- Smart Settlements: Greedy algorithm minimizes transaction count.
- Settlement Status: Button says Calculate / View / Recalculate based on state.
- Dark/Light Mode: Persists in localStorage.
- Responsive: Mobile, tablet, desktop.

## Settlement Algorithm

1. Calculate each person net balance (total paid minus total owed)
2. Separate into creditors (positive) and debtors (negative)
3. Greedily match largest debtor with largest creditor
4. Produces the minimum number of transactions

Example: A owes B 1000, B owes C 2000 -> Algorithm: A pays C 1000, B pays C 1000.

## API Endpoints

POST   /api/auth/signup                         Register
POST   /api/auth/login                          Login
GET    /api/auth/me                             Current user
GET    /api/groups                              List groups
POST   /api/groups                              Create group
GET    /api/groups/{id}                         Get group
DELETE /api/groups/{id}                         Delete group
GET    /api/groups/{id}/expenses                List expenses
POST   /api/groups/{id}/expenses                Add expense
PUT    /api/groups/{id}/expenses/{eid}          Update expense
DELETE /api/groups/{id}/expenses/{eid}          Delete expense
POST   /api/groups/{id}/settlements             Calculate settlements
GET    /api/groups/{id}/settlements             Get settlements

## Troubleshooting

MongoDB connection fails:
- Local: Run mongod or check Windows Services for MongoDB
- Atlas: Whitelist your IP in Network Access

Module not found (backend):
- Activate venv: .\venv\Scripts\Activate.ps1
- Reinstall: pip install -r requirements.txt

CORS error in browser:
- Ensure backend runs on port 8000
- Check VITE_API_URL in frontend/.env

PowerShell script error:
  Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

## Tech Stack

Frontend:     React 18 + Vite, React Router v6, Axios, Lucide React, React Hot Toast
Backend:      FastAPI, MongoDB + Motor (async), JWT (python-jose), bcrypt (passlib)
Validation:   Pydantic v2 + pydantic-settings
Fonts:        Inter + Outfit (Google Fonts)
