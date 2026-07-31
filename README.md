# SkillBridge Backend Service

A production-ready, highly structured Node.js boilerplate built with **Express.js**, **MongoDB**, and **Mongoose**. This project follows the Model-View-Controller (MVC) design pattern and incorporates industry best practices for security, logging, validation, and error management.

---

## Features

- **Standard MVC Architecture**: Structured code separation into Models, Services, Controllers, and Routes.
- **Robust Security**: Configured with `helmet` for security headers, `cors` for cross-origin policies, and `bcryptjs` for secure password hashing.
- **Optimization**: Response compression enabled with `compression` (gzip).
- **Environment Management**: Configured using `dotenv` with template environments specified in `.env.example`.
- **Global Error Handling**: Centralized middleware mapping database validation, JWT expiration, and custom client exceptions into clean, uniform API payloads.
- **Request Validation**: Integrated request checking using `express-validator` to guarantee schema validity before hitting business service functions.
- **JWT Helper Skeleton**: Token-based authentication support configured through modular JWT signature and verification utilities.
- **Auto-restart on Save**: Configured with `nodemon` for active local development.
- **Health Check Endpoint**: Mounts `/health` for checking service availability and database connection status.

---

## Directory Structure

```text
skillbridge/
├── src/
│   ├── config/          # Application & Database Configuration parameters
│   ├── constants/       # Global constants (HTTP status codes, User roles, etc.)
│   ├── controllers/     # MVC Controllers (maps HTTP requests to service methods)
│   ├── database/        # Mongoose connection & lifecycle handlers
│   ├── middlewares/     # Express custom middlewares (Auth guard, Error handler)
│   ├── models/          # Mongoose database schemas
│   ├── routes/          # REST route declarations (API versioning v1)
│   ├── services/        # Business logic & Database queries
│   ├── utils/           # Helper utilities (ApiError, ApiResponse, asyncHandler, jwt)
│   ├── validators/      # Schema body validation rules
│   ├── app.js           # Express app settings and middleware registration
│   └── server.js        # Server bootstrap entry point and global handlers
├── .env.example         # Template environment file
├── .gitignore           # Version control ignore lists
├── package.json         # Node manifest and dependencies
└── README.md            # Setup instructions
```

---

## Getting Started

### Prerequisites

To run this backend locally, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16.x or higher recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) (running locally or a remote MongoDB Atlas URI)

### Installation

1. Clone or copy the codebase directory.
2. Navigate to the project root directory:
   ```bash
   cd skillbridge
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```

### Configuration

1. Create a `.env` file in the project root. You can copy the variables from `.env.example`:
   ```bash
   cp .env.example .env
   ```
2. Open the `.env` file and customize the port, database URI, and secret key configurations:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/skillbridge
   CORS_ORIGIN=http://localhost:3000
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=7d
   ```

---

## Running the Application

### Development Mode

Run the server with `nodemon` to enable hot-reloads on file changes:
```bash
npm run dev
```

### Production Mode

Run the server in production environment:
```bash
npm start
```

---

## API Documentation

All routes (except `/health`) are versioned under `/api/v1`.

### 1. Health Status
Verify the system status and MongoDB connectivity.

- **Endpoint**: `GET /health`
- **Access**: Public
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "status": "UP",
      "uptime": "15s",
      "database": "connected",
      "timestamp": "2026-07-31T13:13:30.000Z"
    },
    "message": "System health is optimal."
  }
  ```

### 2. Authentication

#### User Registration
Register a new user account.

- **Endpoint**: `POST /api/v1/users/register`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "_id": "64c7811...",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user",
        "createdAt": "2026-07-31T13:14:00.000Z",
        "updatedAt": "2026-07-31T13:14:00.000Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5..."
    },
    "message": "User registration completed successfully."
  }
  ```

#### User Login
Authenticate with email and password to receive a JWT.

- **Endpoint**: `POST /api/v1/users/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "securepassword123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "_id": "64c7811...",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5..."
    },
    "message": "User authentication completed successfully."
  }
  ```

#### User Profile
Get credentials of the currently logged-in user.

- **Endpoint**: `GET /api/v1/users/profile`
- **Access**: Private (Requires `Authorization: Bearer <token>`)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "_id": "64c7811...",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user",
        "createdAt": "2026-07-31T13:14:00.000Z",
        "updatedAt": "2026-07-31T13:14:00.000Z"
      }
    },
    "message": "User profile retrieved successfully."
  }
  ```

---

## Utility Classes

### Unified Responses

- **`ApiError`**: Thrown in services or routes. Automatically caught by `error.middleware.js` to return:
  ```json
  {
    "success": false,
    "message": "Validation error occurred.",
    "errors": [
      {
        "field": "email",
        "message": "Please enter a valid email address."
      }
    ]
  }
  ```
- **`ApiResponse`**: Formats standard successes:
  ```json
  {
    "success": true,
    "data": { ... },
    "message": "Operation completed successfully"
  }
  ```
