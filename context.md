# InternArea Project Context

## Purpose

This repository implements an internship and job discovery platform with:

- A public-facing website for browsing internships and jobs
- Google sign-in for end users
- Application submission for internships and jobs
- An admin area for posting opportunities and reviewing applications
- A "Public Space" social/community feature with posts, comments, likes, shares, and friend connections

The project is split into a frontend and a backend:

- `internarea/`: Next.js frontend
- `backend/`: Express + MongoDB backend

## High-Level Architecture

### Frontend

- Built with Next.js using the Pages Router
- Uses React, TypeScript, Redux Toolkit, Axios, Firebase Auth, and React Toastify
- Renders public pages, listing pages, application flows, profile/community pages, and admin pages
- Sends HTTP requests directly to the backend using `process.env.NEXT_PUBLIC_API_URL`

### Backend

- Built with Express and Mongoose
- Connects to MongoDB using `DATABASE_URL`
- Exposes REST APIs under `/api`
- Stores internships, jobs, applications, admin credentials, community users, and public posts

## Repository Structure

```text
interareaInternship/
|-- backend/
|   |-- Model/
|   |   |-- AdminCredential.js
|   |   |-- Application.js
|   |   |-- CommunityUser.js
|   |   |-- Internship.js
|   |   |-- Job.js
|   |   `-- PublicPost.js
|   |-- Routes/
|   |   |-- admin.js
|   |   |-- application.js
|   |   |-- community.js
|   |   |-- index.js
|   |   |-- internship.js
|   |   `-- job.js
|   |-- db.js
|   |-- index.js
|   `-- package.json
|-- internarea/
|   |-- public/
|   |-- src/
|   |   |-- Assets/
|   |   |-- Components/
|   |   |   |-- Fotter.tsx
|   |   |   `-- Navbar.tsx
|   |   |-- Feature/
|   |   |   `-- Userslice.js
|   |   |-- firebase/
|   |   |   `-- firebase.js
|   |   |-- pages/
|   |   |   |-- adminlogin/
|   |   |   |-- adminpanel/
|   |   |   |-- applications/
|   |   |   |-- detailapplication/
|   |   |   |-- detailiternship/
|   |   |   |-- detailjob/
|   |   |   |-- forgot-password/
|   |   |   |-- internship/
|   |   |   |-- job/
|   |   |   |-- postInternship/
|   |   |   |-- postJob/
|   |   |   |-- profile/
|   |   |   |-- public-space/
|   |   |   |-- userapplication/
|   |   |   |-- _app.tsx
|   |   |   |-- _document.tsx
|   |   |   `-- index.tsx
|   |   |-- store/
|   |   |   `-- store.js
|   |   `-- styles/
|   |       `-- globals.css
|   |-- next.config.ts
|   `-- package.json
`-- context.md
```

## Technology Stack

### Frontend Stack

- Next.js `15.2.1`
- React `19`
- TypeScript
- Redux Toolkit
- React Redux
- Axios
- Firebase Authentication
- React Toastify
- Swiper
- Lucide React
- Tailwind CSS 4 through PostCSS

### Backend Stack

- Node.js
- Express `4.x`
- MongoDB
- Mongoose `8.x`
- CORS
- body-parser
- dotenv
- nodemon

## Frontend Architecture

### Global App Shell

`src/pages/_app.tsx` is the frontend composition root.

Responsibilities:

- Wraps the application with the Redux `Provider`
- Registers a Firebase auth listener
- Dispatches `login` and `logout` actions into Redux based on Google auth state
- Renders the global `Navbar`
- Renders the active page component
- Renders the global `Footer`
- Mounts the `ToastContainer`

This means user auth state is maintained on the client and mirrored into Redux during runtime.

### User State Management

The Redux store is minimal:

- `src/store/store.js` configures the store
- `src/Feature/Userslice.js` defines login/logout reducers and the user selector

Current behavior:

- `login` stores the Firebase user payload in Redux
- `logout` clears it
- The selector used across the app is `selectuser`

Note:

- The slice initializes state with `value: null`, but reducers and selectors use `state.user`. The app still works because reducers create `state.user`, but the initial state shape is inconsistent.

### Authentication Model

#### User Authentication

- Implemented with Firebase Google sign-in
- Configured in `src/firebase/firebase.js`
- Triggered from `src/Components/Navbar.tsx` using `signInWithPopup`
- Logout is handled with `signOut(auth)`
- Auth state is observed in `_app.tsx` through `auth.onAuthStateChanged`

User session data commonly used in the app:

- `uid`
- `name`
- `email`
- `photo`
- `phoneNumber`

#### Admin Authentication

- The admin login page is `src/pages/adminlogin/index.tsx`
- It posts username/password to `POST /api/admin/adminlogin`
- On success, the frontend navigates to `/adminpanel`

Important implementation detail:

- There is no JWT, cookie, or persistent backend-admin session
- Admin access is controlled only by client-side navigation after a successful login response
- This is functional for a demo or prototype, but not a secure production authorization model

### Next.js Routing

The project uses the Pages Router, not the App Router.

Key page groups:

#### Public Pages

- `/` - home page
- `/internship` - internship listing page
- `/job` - job listing page

#### Detail Pages

- `/detailiternship/[id]` - internship detail and apply page
- `/detailjob/[id]` - job detail and apply page
- `/detailapplication/[id]` - application detail page

#### User Pages

- `/profile` - signed-in user profile summary
- `/userapplication` - user-facing application list page
- `/public-space` - social/community page

#### Admin Pages

- `/adminlogin` - admin login
- `/forgot-password` - admin password reset request
- `/adminpanel` - admin landing/dashboard
- `/postInternship` - internship creation form
- `/postJob` - job creation form
- `/applications` - application moderation page

## Frontend Feature Implementation

### Home Page

`src/pages/index.tsx` provides:

- Hero content and marketing copy
- A Swiper carousel
- Category chips
- Internship preview cards
- Job preview cards

Data flow:

- On mount, it fetches internships and jobs in parallel from:
  - `/api/internship`
  - `/api/job`
- It stores results in local component state
- It filters visible cards by selected category

### Internship Listing

`src/pages/internship/index.tsx` implements:

- Internship browsing
- Category filtering
- Data retrieval from the backend internship API

Typical internship fields used in the UI:

- `title`
- `company`
- `location`
- `category`
- `stipend`
- `startDate`

### Job Listing

`src/pages/job/index.tsx` implements:

- Job browsing
- Filtering similar to internships
- Data retrieval from the backend job API

Typical job fields used in the UI:

- `title`
- `company`
- `location`
- `Experience`
- `CTC`
- `category`

### Internship Application Flow

`src/pages/detailiternship/[id]/index.tsx` drives the internship application experience.

Implementation flow:

1. Read the internship id from the route
2. Fetch the selected internship from `GET /api/internship/:id`
3. Display internship details
4. Collect additional user input such as cover letter and availability
5. Read the signed-in user from Redux
6. Submit the application to `POST /api/application`

Payload content includes:

- Company/category context
- Cover letter
- User object from Redux
- The internship object or selected application target payload

### Job Application Flow

`src/pages/detailjob/[id]/index.tsx` implements the same pattern for jobs:

1. Read job id from route
2. Fetch the job from `GET /api/job/:id`
3. Show job details
4. Collect application input
5. Submit to `POST /api/application`

### Admin Opportunity Posting

#### Internship Posting

`src/pages/postInternship/index.tsx` contains a form that posts to:

- `POST /api/internship`

Form content maps closely to the internship schema:

- Title
- Company
- Location
- Category
- About company
- About internship
- Who can apply
- Perks
- Number of openings
- Stipend
- Start date
- Additional info

#### Job Posting

`src/pages/postJob/index.tsx` contains a form that posts to:

- `POST /api/job`

Form content maps to the job schema:

- Title
- Company
- Location
- Experience
- Category
- About company
- About job
- Who can apply
- Perks
- Additional info
- CTC
- Start date

### Application Moderation

`src/pages/applications/index.tsx` is the admin-facing application review page.

Responsibilities:

- Fetch all applications from `GET /api/application`
- Display application entries
- Allow the admin to accept or reject applications
- Update status through `PUT /api/application/:id`

Application statuses supported by the backend:

- `pending`
- `accepted`
- `rejected`

### Public Space Community Feature

`src/pages/public-space/index.tsx` is the richest frontend page in the repository.

Capabilities:

- Creates or refreshes a community profile for the signed-in user
- Loads the public feed
- Adds friends
- Creates posts with text and media
- Likes posts
- Comments on posts
- Shares posts

Community flow:

1. Build a normalized `communityUser` object from Redux user data
2. POST that user to `/api/community/profile`
3. Fetch feed data from `/api/community/feed`
4. Allow friend creation using `/api/community/friends`
5. Allow post creation using `/api/community/posts`
6. Toggle likes using `/api/community/posts/:id/like`
7. Add comments using `/api/community/posts/:id/comment`
8. Increment share count using `/api/community/posts/:id/share`

Media upload implementation:

- Files are read in the browser using `FileReader`
- Files are converted to data URLs
- Data URLs are sent directly in the API request body
- There is no separate storage layer like S3, Cloudinary, or Firebase Storage

Posting rules:

- A user with zero friends cannot create public posts
- Users with `1` to `10` friends can post up to the number of their friends per day
- Users with more than `10` friends have an unlimited daily posting limit

## Backend Architecture

### Server Bootstrap

`backend/index.js` is the backend entry point.

Responsibilities:

- Creates the Express app
- Enables global CORS
- Configures JSON and URL-encoded body parsing with a `50mb` limit
- Exposes a health-like root route at `/`
- Mounts all API routes under `/api`
- Connects to MongoDB
- Starts the HTTP server

Current CORS configuration:

- `origin: "*"`
- `credentials: true`

This setup keeps development simple, but it is too open for production deployment.

### Database Connection

`backend/db.js`:

- Loads environment variables using `dotenv`
- Reads `process.env.DATABASE_URL`
- Connects Mongoose to MongoDB

Current implementation note:

- The connection call is simple and does not include robust connection error handling or retry logic

### API Routing

`backend/Routes/index.js` mounts route modules:

- `/api/admin`
- `/api/internship`
- `/api/job`
- `/api/application`
- `/api/community`

## Backend Route Modules

### Admin Routes

File: `backend/Routes/admin.js`

Endpoints:

- `POST /api/admin/adminlogin`
- `POST /api/admin/forgot-password`

Implementation details:

- If an admin account does not exist, the backend auto-creates one from environment variables or defaults
- Passwords are hashed using `crypto.scryptSync`
- Password comparison uses `crypto.timingSafeEqual`
- The forgot-password flow resets the password and returns the new password in the API response
- Password reset is limited to once per day through `lastPasswordResetAt`

Default admin fallback values:

- Username: `admin`
- Email: `admin@internarea.com`
- Phone: `9999999999`
- Password: `admin`

Production caveat:

- Returning the new password directly in the API response is not secure for real production systems

### Internship Routes

File: `backend/Routes/internship.js`

Endpoints:

- `POST /api/internship`
- `GET /api/internship`
- `GET /api/internship/:id`

Behavior:

- Creates new internship documents
- Returns all internships
- Returns one internship by Mongo id

### Job Routes

File: `backend/Routes/job.js`

Endpoints:

- `POST /api/job`
- `GET /api/job`
- `GET /api/job/:id`

Behavior:

- Creates new job documents
- Returns all jobs
- Returns one job by Mongo id

Implementation note:

- Field casing is inconsistent in the job model and route payloads, such as `Experience`, `AdditionalInfo`, `CTC`, and `StartDate`
- This increases the chance of frontend/backend mismatches

### Application Routes

File: `backend/Routes/application.js`

Endpoints:

- `POST /api/application`
- `GET /api/application`
- `GET /api/application/:id`
- `PUT /api/application/:id`

Behavior:

- Stores a new application object
- Retrieves all applications
- Retrieves one application by id
- Updates application status based on `action`

Accepted values for `action`:

- `accepted`
- `rejected`

### Community Routes

File: `backend/Routes/community.js`

Endpoints:

- `POST /api/community/profile`
- `POST /api/community/friends`
- `GET /api/community/feed`
- `POST /api/community/posts`
- `POST /api/community/posts/:id/like`
- `POST /api/community/posts/:id/comment`
- `POST /api/community/posts/:id/share`

Key backend logic includes:

- Community user creation or synchronization
- Friend relationship creation in both directions
- Feed retrieval sorted by newest first
- Post creation with posting limits
- Like toggling
- Comment creation
- Share count incrementing

## Database Models

### Internship Model

File: `backend/Model/Internship.js`

Main fields:

- `title`
- `company`
- `location`
- `category`
- `aboutCompany`
- `aboutInternship`
- `whoCanApply`
- `perks`
- `numberOfOpening`
- `stipend`
- `startDate`
- `additionalInfo`

### Job Model

File: `backend/Model/Job.js`

Main fields:

- `title`
- `company`
- `location`
- `Experience`
- `category`
- `aboutCompany`
- `aboutJob`
- `whoCanApply`
- `perks`
- `AdditionalInfo`
- `CTC`
- `StartDate`

### Application Model

File: `backend/Model/Application.js`

Main fields:

- `company`
- `category`
- `coverLetter`
- `user`
- `createdAt`
- `status`
- `Application`

Modeling note:

- The application stores the applicant and target object as generic embedded objects rather than normalized references

### AdminCredential Model

File: `backend/Model/AdminCredential.js`

Main fields:

- `username`
- `email`
- `phone`
- `passwordHash`
- `passwordSalt`
- `lastPasswordResetAt`
- timestamps enabled

### CommunityUser Model

File: `backend/Model/CommunityUser.js`

Purpose:

- Represents a social profile for the signed-in user
- Stores friend connections
- Tracks normalized identity used by the community system

Expected shape from usage:

- `userKey`
- `name`
- `email`
- `photo`
- `friends[]`

### PublicPost Model

File: `backend/Model/PublicPost.js`

Purpose:

- Stores public feed posts and interactions

Expected shape from route usage:

- `author`
- `text`
- `media[]`
- `likes[]`
- `comments[]`
- `sharesCount`
- timestamps

## End-to-End Data Flows

### User Login Flow

1. User clicks "Continue with google" in `Navbar.tsx`
2. Firebase popup auth runs
3. Firebase emits auth state change
4. `_app.tsx` dispatches `login(...)`
5. Redux stores the authenticated user
6. Signed-in UI becomes available

### Browse and View Opportunity Flow

1. User opens `/`, `/internship`, or `/job`
2. Frontend calls backend listing APIs
3. Backend reads MongoDB documents
4. Frontend renders lists/cards
5. User opens a detail page via the item id

### Apply Flow

1. User opens a detail page
2. Frontend fetches one internship/job record
3. User fills application details
4. Frontend combines page data and Redux user data
5. Frontend posts to `/api/application`
6. Backend stores an application record with status `pending`

### Admin Review Flow

1. Admin logs in from `/adminlogin`
2. Frontend routes to `/adminpanel`
3. Admin opens `/applications`
4. Frontend fetches all applications
5. Admin accepts or rejects one
6. Frontend sends `PUT /api/application/:id`
7. Backend updates the `status` field

### Community Flow

1. Signed-in user opens `/public-space`
2. Frontend sends profile sync request to `/api/community/profile`
3. Backend ensures `CommunityUser` exists
4. Frontend loads feed from `/api/community/feed`
5. User can add a friend or create posts/interactions
6. Backend updates MongoDB documents accordingly

## Environment Variables

### Frontend

Required:

- `NEXT_PUBLIC_API_URL`

Purpose:

- Base URL used by Axios for backend API requests

Example:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Backend

Required:

- `DATABASE_URL`

Optional admin defaults:

- `ADMIN_USERNAME`
- `ADMIN_EMAIL`
- `ADMIN_PHONE`
- `ADMIN_PASSWORD`

Example:

```env
DATABASE_URL=mongodb://127.0.0.1:27017/internarea
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@internarea.com
ADMIN_PHONE=9999999999
ADMIN_PASSWORD=admin
```

## Local Development Setup

### Backend

Run from `backend/`:

```bash
npm install
npm start
```

Default backend port:

- `5000` unless overridden by `PORT`

### Frontend

Run from `internarea/`:

```bash
npm install
npm run dev
```

Default frontend port:

- `3000`

## Config and Runtime Notes

### Next.js Config

`internarea/next.config.ts` sets:

- `reactStrictMode: true`
- `Cross-Origin-Opener-Policy: same-origin-allow-popups`

The header is likely added to support auth popup compatibility.

### Asset Usage

- The frontend contains many static images under `src/Assets/`
- The public logo is also available under `public/`
- The UI mixes imported assets and direct `/public` asset references

### Notifications

- The frontend uses React Toastify for success and error messaging throughout login, posting, and community actions

## Implementation Caveats and Known Gaps

These are important to understand when extending the project:

- Admin auth has no server-issued session, token, or route protection
- Firebase configuration is hardcoded in the frontend instead of being environment-driven
- Backend CORS is fully open
- Password reset returns the new password directly in the API response
- The application model stores flexible objects instead of normalized references
- Job field naming is inconsistent across casing conventions
- Redux user slice initial state shape is inconsistent with reducer usage
- Community media is stored as request body data URLs instead of dedicated file storage
- There is little centralized validation and limited error handling in route handlers
- No automated tests are currently set up in the repository

## Suggested Extension Points

If development continues, these are the most natural next improvements:

- Add secure admin sessions with JWT or HTTP-only cookies
- Add route guards for admin pages
- Normalize model field naming across frontend and backend
- Add request validation with a schema library
- Add better MongoDB connection and error handling
- Add pagination and search for internships, jobs, applications, and community feed
- Move media uploads to real object storage
- Add backend authorization around application moderation and posting APIs
- Add automated tests for route handlers and critical frontend flows

## Quick Context Summary

This is a two-part full-stack project:

- `internarea/` handles UI, routing, Firebase sign-in, and client-side state
- `backend/` handles CRUD APIs, MongoDB persistence, admin credential storage, application management, and community interactions

Core product domains:

- Internship listings
- Job listings
- User applications
- Admin posting and moderation
- Community/social public feed

The most important implementation files to understand first are:

- `backend/index.js`
- `backend/Routes/index.js`
- `backend/Routes/admin.js`
- `backend/Routes/application.js`
- `backend/Routes/community.js`
- `internarea/src/pages/_app.tsx`
- `internarea/src/Components/Navbar.tsx`
- `internarea/src/pages/index.tsx`
- `internarea/src/pages/detailiternship/[id]/index.tsx`
- `internarea/src/pages/detailjob/[id]/index.tsx`
- `internarea/src/pages/public-space/index.tsx`
- `internarea/src/pages/applications/index.tsx`

This document should give enough context to onboard a developer, understand the existing implementation, and safely plan future changes.
