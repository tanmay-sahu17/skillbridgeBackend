# 🚀 SkillBridge API — Complete Postman Guide

Base URL: `http://localhost:5001`

---

## 🟢 Part 1: Authentication & Onboarding Setup

### 1.1 Health Check
```
GET /health
```
✅ Use this to check if the server is running.

### 1.2 Get College List (Public)
```
GET /api/v1/college/list
```
✅ **Use Case:** Before a Student can signup, they need a `collegeId`. Use this API to fetch the list of approved colleges and grab an `id`.

### 1.3 Register (College)
```
POST /api/v1/auth/register
```
**Body (JSON):**
```json
{
  "name": "SSIPMT College",
  "email": "admin@ssipmt.com",
  "password": "Test@1234",
  "role": "COLLEGE"
}
```

### 1.4 Register (Student)
```
POST /api/v1/auth/register
```
**Body (JSON):**
```json
{
  "name": "John Doe",
  "email": "john@ssipmt.com",
  "password": "Test@1234",
  "role": "STUDENT",
  "collegeId": "<insert-id-from-step-1.2>"
}
```
*(⚠️ Student email MUST end with the selected college's domain)*

### 1.5 Verify Email OTP
```
POST /api/v1/auth/verify-email
```
**Body (JSON):**
```json
{
  "email": "admin@ssipmt.com",
  "otp": "123456"
}
```
*(Check your terminal or email inbox for the 6-digit OTP)*

### 1.6 Login
```
POST /api/v1/auth/login
```
**Body (JSON):**
```json
{
  "email": "admin@ssipmt.com",
  "password": "Test@1234"
}
```
> [!IMPORTANT]
> **Copy the `token` from the response!** All onboarding and protected routes below require the following header:
> `Authorization: Bearer <token>`

---

## 🏛️ Part 2: College Onboarding (8 Sections)

*(Ensure your `Authorization` header is set with a **COLLEGE** user's token)*

### Section 1: Basic Info
```
POST /api/v1/college/onboarding/basic-info
```
**Body (JSON):**
```json
{
  "collegeName": "Shri Shankaracharya Institute",
  "domain": "ssipmt.com",
  "shortName": "SSIPMT",
  "collegeType": "PRIVATE",
  "establishmentYear": 1998,
  "affiliatedUniversity": "CSVTU",
  "accreditations": ["AICTE", "UGC", "NAAC"]
}
```

### Section 2: Contact Info
```
POST /api/v1/college/onboarding/contact-info
```
**Body (JSON):**
```json
{
  "officialEmail": "info@ssipmt.com",
  "officialMobile": "9876543210",
  "alternateContact": "",
  "officialWebsite": "https://www.ssipmt.com",
  "socialLinks": {
    "linkedin": "https://linkedin.com/school/ssipmt",
    "otherLinks": [
      { "type": "Twitter", "url": "https://twitter.com/ssipmt" }
    ]
  }
}
```

### Section 3: Address
```
POST /api/v1/college/onboarding/address
```
**Body (JSON):**
```json
{
  "country": "India",
  "state": "Chhattisgarh",
  "district": "Raipur",
  "city": "Raipur",
  "pinCode": "492010",
  "completeAddress": "Junwani, Bhilai"
}
```

### Section 4: Representative
```
POST /api/v1/college/onboarding/representative
```
**Body (JSON):**
```json
{
  "fullName": "Dr. Shreyansh Golchha",
  "designation": "TPO",
  "officialEmail": "tpo@ssipmt.com",
  "mobileNumber": "9876543210",
  "employeeId": "EMP001"
}
```

### Section 5: Documents (⚠️ form-data)
```
POST /api/v1/college/onboarding/documents
```
**Body (form-data):**
| Key | Type | Value |
|-----|------|-------|
| collegeLogo | File | Choose image (Mandatory) |
| affiliationCert | File | Choose PDF/image (Mandatory) |
| authorizationLetter | File | Choose PDF/image (Mandatory) |
| gstCertificate | File | Choose PDF/image (Optional) |
| otherCertificates | File | Choose up to 5 additional PDFs/images (Optional) |

### Section 6: Academic Info
```
POST /api/v1/college/onboarding/academic-info
```
**Body (JSON):**
```json
{
  "totalDepartments": 4,
  "departments": ["Computer Science", "Mechanical", "Civil", "IT"],
  "totalCourses": 2,
  "courses": ["B.Tech", "M.Tech"],
  "totalStudents": 3000,
  "totalFaculty": 150,
  "campusType": "SINGLE"
}
```

### Section 7: Verification (Mobile OTP)

**Step 1: Send Mobile OTP**
```
POST /api/v1/college/onboarding/verification/send-mobile-otp
```
**Body (JSON):** `{}`
*(Sends a 6-digit OTP to the official mobile number saved in Section 2)*

**Step 2: Verify Mobile OTP**
```
POST /api/v1/college/onboarding/verification/verify-mobile-otp
```
**Body (JSON):**
```json
{
  "otp": "123456"
}
```

*(Note: The bypass API `POST /api/v1/college/onboarding/verification` is also available for testing)*

### Section 8: Terms & Declaration (Final Submit)
```
POST /api/v1/college/onboarding/terms
```
**Body (JSON):**
```json
{
  "termsAccepted": true,
  "authorizedConfirmed": true,
  "accuracyConfirmed": true
}
```

### 📊 College Data Checking
- **Get Progress:** `GET /api/v1/college/onboarding/progress`
- **Get Full Data:** `GET /api/v1/college/data`

---

## 🎓 Part 3: Student Onboarding (9 Sections)

*(Ensure your `Authorization` header is set with a **STUDENT** user's token)*

### Section 1: Basic Info
```
POST /api/v1/student/onboarding/basic-info
```
**Body (JSON):**
```json
{
  "firstName": "John",
  "middleName": "A",
  "lastName": "Doe",
  "gender": "MALE",
  "dateOfBirth": "2002-05-15T00:00:00Z"
}
```

### Section 2: Contact Info
```
POST /api/v1/student/onboarding/contact-info
```
**Body (JSON):**
```json
{
  "personalEmail": "johndoe@gmail.com",
  "mobileNumber": "9876543210",
  "alternateMobile": ""
}
```

### Section 3: Academic Info
```
POST /api/v1/student/onboarding/academic-info
```
**Body (JSON):**
```json
{
  "enrollmentNo": "EN12345",
  "studentIdNo": "STU987",
  "course": "B.Tech",
  "branch": "Computer Science",
  "currentYear": 3,
  "currentSemester": 6,
  "section": "A",
  "batch": "2021-2025"
}
```

### Section 4: Career Profile
```
POST /api/v1/student/onboarding/career-profile
```
**Body (JSON):**
```json
{
  "headline": "MERN Stack Developer",
  "skills": ["React", "Node.js", "MongoDB"],
  "careerInterest": ["INTERNSHIP", "FULL_TIME"],
  "languagesKnown": ["English", "Hindi"],
  "bio": "Passionate developer building scalable web applications."
}
```

### Section 5: Portfolio (⚠️ Optional form-data for resume)
```
POST /api/v1/student/onboarding/portfolio
```
**Body (form-data):**
| Key | Type | Value |
|-----|------|-------|
| resume | File | Choose PDF |
| data | Text | `{"linkedin":"https://linkedin.com/in/johndoe", "github":"https://github.com/johndoe"}` |

*(If you don't want to upload a resume, you can just send the JSON normally as `application/json` without form-data)*

### Section 6: Documents (⚠️ form-data)
```
POST /api/v1/student/onboarding/documents
```
**Body (form-data):**
| Key | Type | Value |
|-----|------|-------|
| studentIdCardFront | File | Choose image (Mandatory) |
| studentIdCardBack | File | Choose image (Optional) |
| bonafideCert | File | Choose PDF/image (Optional) |
| feeReceipt | File | Choose PDF/image (Optional) |

### Section 7: Platform Role
```
POST /api/v1/student/onboarding/platform-role
```
**Body (JSON):**
```json
{
  "platformRole": "FREELANCER"
}
```
*(Options: `FREELANCER`, `OPPORTUNITY_PROVIDER`, `BOTH`)*

### Section 8: Verification (Mobile OTP)

**Step 1: Send Mobile OTP**
```
POST /api/v1/student/onboarding/verification/send-mobile-otp
```
**Body (JSON):** `{}`
*(Sends a 6-digit OTP to the mobile number saved in Section 2)*

**Step 2: Verify Mobile OTP**
```
POST /api/v1/student/onboarding/verification/verify-mobile-otp
```
**Body (JSON):**
```json
{
  "otp": "123456"
}
```

*(Note: The bypass API `POST /api/v1/student/onboarding/verification` is also available for testing)*

### Section 9: Declaration (Final Submit)
```
POST /api/v1/student/onboarding/declaration
```
**Body (JSON):**
```json
{
  "infoCorrectConfirmed": true,
  "collegeVerifyAccepted": true,
  "termsAccepted": true
}
```

### 📊 Student Data Checking
- **Get Progress:** `GET /api/v1/student/onboarding/progress`
- **Get Full Data:** `GET /api/v1/student/data`
