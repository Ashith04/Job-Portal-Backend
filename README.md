# Job Portal Backend System

A secure, scalable, and production-ready Job Portal Backend System built with **Node.js**, **Express.js**, **MongoDB**, and **JWT**. Supports three roles: **Admin**, **Employer**, and **Job Seeker** with full CRUD, authentication, file uploads, analytics, and more.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Authentication | JWT (Access + Refresh Tokens) |
| Password Hashing | bcryptjs |
| Validation | Joi |
| File Upload | Multer + Cloudinary |
| Logging | Winston + Morgan |
| API Docs | Swagger (OpenAPI 3.0) |
| Rate Limiting | express-rate-limit |
| Security | Helmet, express-mongo-sanitize, CORS |
| Testing | Jest + Supertest |

---

## Project Structure

```
job-portal-backend/
├── src/
│   ├── config/
│   │   ├── db.js               # MongoDB connection
│   │   ├── cloudinary.js       # Cloudinary + Multer config
│   │   └── swagger.js          # Swagger/OpenAPI config
│   ├── controllers/
│   │   ├── authController.js   # Register, Login, Refresh, Logout
│   │   ├── employerController.js
│   │   ├── jobSeekerController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── auth.js             # JWT protect + role authorize
│   │   ├── errorHandler.js     # Centralized error handling
│   │   └── validate.js         # Joi validation middleware
│   ├── models/
│   │   ├── User.js             # User model (all roles)
│   │   ├── Job.js              # Job model
│   │   ├── Application.js      # Application model
│   │   └── RefreshToken.js     # Refresh token storage
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── employerRoutes.js
│   │   ├── jobSeekerRoutes.js
│   │   └── adminRoutes.js
│   ├── tests/
│   │   ├── auth.test.js
│   │   ├── jobs.test.js
│   │   └── testSetup.js
│   ├── utils/
│   │   ├── apiResponse.js      # Standardized responses
│   │   ├── logger.js           # Winston logger
│   │   └── paginate.js         # Pagination helper
│   ├── validators/
│   │   └── schemas.js          # All Joi schemas
│   └── app.js                  # Express app setup
├── scripts/
│   └── seedAdmin.js            # Admin seeder
├── logs/                       # Winston log files
├── .env.example
├── .env
├── .gitignore
├── jest.config.json
├── package.json
└── server.js                   # Entry point
```

---

## Prerequisites

Make sure you have the following installed:

- **Node.js** v18+ → [Download](https://nodejs.org/)
- **MongoDB** v6+ → [Download](https://www.mongodb.com/try/download/community) OR use [MongoDB Atlas](https://www.mongodb.com/atlas)
- **npm** v9+ (comes with Node.js)
- **Cloudinary Account** (free) → [Sign up](https://cloudinary.com/) *(for file uploads)*

---

## Installation & Setup

### Step 1 — Clone / Navigate to the project

```bash
cd job-portal-backend
```

### Step 2 — Install dependencies

```bash
npm install
```

### Step 3 — Configure environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/job-portal

# Generate strong secrets (use: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Cloudinary (get from https://cloudinary.com/console)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

NODE_ENV=development
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

> **MongoDB Atlas (Cloud):** Replace `MONGO_URI` with your Atlas connection string:
> `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/job-portal`

### Step 4 — Start MongoDB (if using local)

**Windows:**
```bash
net start MongoDB
```
Or start MongoDB Compass and connect to `localhost:27017`

**macOS/Linux:**
```bash
sudo systemctl start mongod
# or
brew services start mongodb-community
```

### Step 5 — Seed the Admin user

```bash
npm run seed:admin
```

This creates:
- **Email:** `admin@jobportal.com`
- **Password:** `Admin@123456`

### Step 6 — Start the server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

You should see:
```
info: MongoDB Connected: localhost
info: Server running in development mode on port 5000
info: API Docs available at http://localhost:5000/api-docs
```

---

## API Documentation (Swagger)

Once the server is running, open:

```
http://localhost:5000/api-docs
```

You can test all endpoints directly from the Swagger UI.

---

## API Endpoints Reference

### Base URL: `http://localhost:5000`

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |

---

### Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login |
| POST | `/api/auth/refresh-token` | ❌ | Refresh access token |
| POST | `/api/auth/logout` | ✅ | Logout (revoke refresh token) |
| GET | `/api/auth/me` | ✅ | Get current user |

---

### Employer (`/api/employer`) — Role: `employer`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employer/company` | Get company profile |
| PUT | `/api/employer/company` | Update company profile + logo |
| GET | `/api/employer/jobs` | Get all my jobs (paginated) |
| POST | `/api/employer/jobs` | Create a new job |
| GET | `/api/employer/jobs/:id` | Get single job |
| PUT | `/api/employer/jobs/:id` | Update job |
| DELETE | `/api/employer/jobs/:id` | Soft delete job |
| GET | `/api/employer/jobs/:jobId/applicants` | View applicants |
| PATCH | `/api/employer/applications/:applicationId/status` | Shortlist/Reject/Hire |

---

### Job Seeker (`/api/jobseeker`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/jobseeker/jobs` | ❌ | Search & filter jobs |
| GET | `/api/jobseeker/jobs/:id` | ❌ | Get job details |
| GET | `/api/jobseeker/profile` | ✅ | Get my profile |
| PUT | `/api/jobseeker/profile` | ✅ | Update profile + avatar |
| POST | `/api/jobseeker/resume` | ✅ | Upload resume (PDF/DOC) |
| POST | `/api/jobseeker/jobs/:jobId/apply` | ✅ | Apply for a job |
| GET | `/api/jobseeker/applications` | ✅ | My applications (paginated) |
| GET | `/api/jobseeker/applications/:id` | ✅ | Single application details |
| DELETE | `/api/jobseeker/applications/:id` | ✅ | Withdraw application |

---

### Admin (`/api/admin`) — Role: `admin`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/analytics` | Platform analytics |
| GET | `/api/admin/users` | All users (filter, search, paginate) |
| GET | `/api/admin/users/:id` | Single user |
| PATCH | `/api/admin/users/:id/block` | Block/Unblock user |
| DELETE | `/api/admin/users/:id` | Soft delete user |
| GET | `/api/admin/jobs` | All jobs (admin view) |
| DELETE | `/api/admin/jobs/:id` | Remove fake/spam job |
| PATCH | `/api/admin/jobs/:id/flag` | Flag/Unflag suspicious job |

---

## Testing with Postman / Thunder Client

### 1. Register an Employer
```json
POST /api/auth/register
{
  "name": "Tech Corp",
  "email": "employer@techcorp.com",
  "password": "password123",
  "role": "employer"
}
```

### 2. Login and get tokens
```json
POST /api/auth/login
{
  "email": "employer@techcorp.com",
  "password": "password123"
}
```
Copy the `accessToken` from the response.

### 3. Create a Job (set Authorization: Bearer <token>)
```json
POST /api/employer/jobs
{
  "title": "Senior Node.js Developer",
  "description": "We are looking for an experienced Node.js developer to build scalable REST APIs.",
  "skillsRequired": ["Node.js", "MongoDB", "Express.js"],
  "tags": ["backend", "nodejs", "api"],
  "employmentType": "full-time",
  "experienceLevel": "senior",
  "salary": { "min": 800000, "max": 1500000, "currency": "INR", "period": "yearly" },
  "location": { "city": "Bangalore", "state": "Karnataka", "country": "India" },
  "deadline": "2025-12-31",
  "openings": 2
}
```

### 4. Register a Job Seeker and Apply
```json
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "jobseeker"
}
```

Upload resume first:
```
POST /api/jobseeker/resume
Content-Type: multipart/form-data
Body: resume = <your PDF file>
```

Then apply:
```json
POST /api/jobseeker/jobs/<jobId>/apply
{
  "coverLetter": "I am very interested in this position..."
}
```

### 5. Admin Login
```json
POST /api/auth/login
{
  "email": "admin@jobportal.com",
  "password": "Admin@123456"
}
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage
```

Test suites cover:
- User registration & login
- Token refresh & logout
- JWT protection & role-based access
- Job CRUD operations
- Application submission & duplicate prevention
- Pagination & filtering

---

## Key Features Implemented

### Security
- ✅ JWT Access Token (15min) + Refresh Token (7 days) with rotation
- ✅ Refresh token stored in DB with revocation support
- ✅ bcrypt password hashing (salt rounds: 12)
- ✅ Role-based middleware (admin / employer / jobseeker)
- ✅ Helmet security headers
- ✅ MongoDB injection sanitization
- ✅ API rate limiting (global + auth-specific)
- ✅ Input validation with Joi

### Database Design
- ✅ Arrays: `skillsRequired`, `tags`, `skills`, `education`, `experience`, `statusHistory`
- ✅ Nested Objects: `salary`, `location`, `company`, `resume`
- ✅ ObjectId References: Job → User, Application → Job + User
- ✅ Aggregation Pipelines: Analytics dashboard
- ✅ Pagination on all list endpoints
- ✅ Indexes on frequently queried fields
- ✅ Text search index on jobs

### File Uploads
- ✅ Resume upload (PDF/DOC/DOCX, max 5MB) via Cloudinary
- ✅ Profile avatar & company logo upload (JPG/PNG, max 2MB)
- ✅ File type validation

### Application Tracking
- ✅ Status: `applied` → `shortlisted` / `rejected` / `hired`
- ✅ Full status history with timestamps and notes
- ✅ Duplicate application prevention

### Soft Delete
- ✅ Users, Jobs, Applications use `isDeleted` flag (never hard deleted)

### Logging
- ✅ Winston: error.log + combined.log files
- ✅ Morgan: HTTP request logging piped to Winston

### API Documentation
- ✅ Swagger UI at `/api-docs`
- ✅ All endpoints documented with request/response schemas

---

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_REFRESH_SECRET` | Refresh token secret | Required |
| `JWT_EXPIRE` | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRE` | Refresh token expiry | `7d` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Required for uploads |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Required for uploads |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Required for uploads |
| `NODE_ENV` | Environment | `development` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | `900000` (15min) |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |

---

## Troubleshooting

**MongoDB connection refused:**
- Ensure MongoDB service is running: `net start MongoDB` (Windows)
- Check `MONGO_URI` in `.env`

**Cloudinary upload fails:**
- Verify `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in `.env`
- File uploads will fail gracefully if Cloudinary is not configured

**JWT errors:**
- Ensure `JWT_SECRET` and `JWT_REFRESH_SECRET` are set and not empty
- Access tokens expire in 15 minutes — use refresh token to get a new one

**Port already in use:**
- Change `PORT` in `.env` to another value (e.g., `5001`)
