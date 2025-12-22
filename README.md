# Digital Contracts - Contract Management Platform

A secure digital contract exchange platform for lawyers built with Python (FastAPI) backend and Next.js frontend.

## Features

- 🔐 Secure user authentication (signup/login with JWT)
- 📄 Upload and send contracts
- ✍️ Sign, edit, or deny contracts
- 🔒 Contract locking mechanism (prevents simultaneous edits)
- 📚 Version control with full history
- 🎨 Modern, easy-to-navigate UI with light colors
- 👥 User management and search

## Tech Stack

### Backend
- Python 3.8+
- FastAPI
- SQLAlchemy (SQLite database)
- JWT authentication
- bcrypt password hashing

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- Axios for API calls

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file (optional, defaults are used):
```bash
cp .env.example .env
# Edit .env and change SECRET_KEY to a secure random string
```

5. Run the backend server:
```bash
uvicorn app.main:app --reload
```

The backend will run on `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Usage

1. Start both backend and frontend servers
2. Open `http://localhost:3000` in your browser
3. Create an account or login
4. Upload contracts, send them to recipients, and manage your contract workflow

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI app entry point
│   │   ├── database.py      # Database configuration
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── auth.py          # Authentication utilities
│   │   └── routers/
│   │       ├── auth.py      # Authentication routes
│   │       ├── contracts.py # Contract routes
│   │       └── users.py     # User routes
│   ├── uploads/             # Uploaded contract files
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── components/
│   │   │   └── Navbar.tsx
│   │   ├── contracts/
│   │   │   ├── page.tsx
│   │   │   ├── upload/
│   │   │   └── [id]/
│   │   ├── login/
│   │   ├── signup/
│   │   ├── about/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── lib/
│   │   └── api.ts           # API client configuration
│   ├── package.json
│   └── tailwind.config.ts
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Contracts
- `POST /api/contracts/upload` - Upload new contract
- `GET /api/contracts/` - Get all contracts (sent and received)
- `GET /api/contracts/{id}` - Get contract details
- `GET /api/contracts/{id}/download` - Download contract file
- `POST /api/contracts/{id}/sign` - Sign contract
- `POST /api/contracts/{id}/deny` - Deny contract
- `POST /api/contracts/{id}/edit` - Edit contract (creates new version)
- `POST /api/contracts/{id}/lock` - Lock/unlock contract
- `GET /api/contracts/{id}/versions` - Get version history
- `GET /api/contracts/{id}/versions/{version_id}/download` - Download specific version

### Users
- `GET /api/users/` - List users
- `GET /api/users/search?q=query` - Search users

## Contract Locking & Version Control

- When a user starts editing a contract, it's automatically locked
- Other users cannot edit while it's locked
- Each edit creates a new version with a version number
- Version history includes timestamps, creator, and change notes
- Contracts can be unlocked manually after editing

## Notes

- This is designed for local/offline use
- The database is SQLite (no separate database server needed)
- Files are stored in the `backend/uploads/` directory
- For production, consider using a proper database (PostgreSQL) and cloud storage


