# API Updates - Version 1.2.0 (Auth Flow Security)

## Overview
The Authentication flow has been updated to prevent unauthorized access by unverified users. 
1. **Registration** no longer logs the user in (no token generated).
2. **Login** explicitly blocks users if their email is not verified.
3. **Email Verification** now acts as the initial login trigger, returning the auth token and setting the secure cookie.

---

### 1. Register User (Public)
```
POST /api/v1/auth/register
```
- **Description:** Creates the user account, generates an OTP, and sends it to their email.
- **Changes:** No longer returns a `token`. No longer sets an `httpOnly` cookie.
- **Response:**
```json
{
  "success": true,
  "message": "User registration completed successfully.",
  "data": {
    "user": {
      "id": "...",
      "name": "...",
      "email": "...",
      "role": "..."
    },
    "onboarding": { ... },
    "message": "Registration successful! Please verify your email using the OTP sent to you."
  }
}
```

---

### 2. Verify Email (Public) -> Triggers Login
```
POST /api/v1/auth/verify-email
```
- **Description:** Validates the OTP sent to the user's email.
- **Changes:** Upon successful verification, it **generates the JWT token**, sets the `httpOnly` cookie, and returns the full user payload (just like the login API).
- **Body:**
```json
{
  "email": "test@example.com",
  "otp": "123456"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Email verified successfully. You are now logged in.",
  "data": {
    "user": {
      "id": "...",
      "name": "...",
      "email": "...",
      "role": "..."
    },
    "token": "eyJhbGciOiJIUzI...",
    "onboarding": {
      "onboardingCompleted": false,
      "currentStep": 1,
      "completedSections": []
    }
  }
}
```
*(Note: A `Set-Cookie` header will also be present in the response)*

---

### 3. Login User (Public)
```
POST /api/v1/auth/login
```
- **Description:** Authenticates a user with email and password.
- **Changes:** Added a strict check. If the user's `isEmailVerified` is false, the API will return a `403 Forbidden` error.
- **Body:**
```json
{
  "email": "test@example.com",
  "password": "Password123!"
}
```
- **Error Response (If unverified):**
```json
{
  "success": false,
  "message": "Please verify your email before logging in."
}
```
