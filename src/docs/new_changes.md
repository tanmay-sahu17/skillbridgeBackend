# API Updates - Version 1.1.0

## Overview
Added complete verification logic separating sign-up emails from official onboarding emails, along with anti-spam rate limiting and auto-verification features.

## 1. Student Onboarding
- **Email Verification Auto-completion:** Students verify their email at sign-up. During the onboarding verification step, completing the Mobile OTP automatically fully marks their verification section as complete (`emailVerified: true`, `mobileVerified: true`).

## 2. College Onboarding
Colleges must verify their **Official Email** (provided in Section 2) alongside their **Official Mobile Number**. The verification step (Section 7) will only progress when BOTH are true.

### New API: Send Email OTP (College)
```
POST /api/v1/college/onboarding/verification/send-email-otp
```
- **Body:** `{}`
- **Description:** Sends a 6-digit OTP to the official email address. Features OTP rate-limiting (2 attempts before 30-min cooldown).
- **Auto-verification:** If the official email perfectly matches the sign-up representative email, this API will auto-verify it and return `{"autoVerified": true}` without sending an email.

### New API: Verify Email OTP (College)
```
POST /api/v1/college/onboarding/verification/verify-email-otp
```
- **Body:**
```json
{
  "otp": "123456"
}
```
- **Description:** Validates the email OTP and updates the database. If the mobile OTP is also verified, Section 7 is marked as complete.

## 3. Cookie-based Authentication & Logout
Tokens are now securely sent via **httpOnly cookies** on signup and login, removing the need for manual token management on the frontend.

### New API: Logout User (Public/Protected)
```
POST /api/v1/auth/logout
```
- **Headers:** Requires cookie or Bearer token for protected access (though logically works to clear cookie).
- **Body:** `{}`
- **Description:** Clears the `httpOnly` token cookie from the user's browser, effectively logging them out.
- **Frontend Action:** Frontend no longer needs to manually clear `localStorage` if relying entirely on cookies, but they must use `withCredentials: true` in their HTTP clients.
