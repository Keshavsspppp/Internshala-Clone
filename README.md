# InternArea - Internship & Job Discovery Platform

InternArea is a full-stack internship and job discovery platform designed to connect students with employers. It features a complete opportunity posting and application moderation system, user authentication, a secure Razorpay-integrated subscription tiering system, and a "Public Space" social community feed where users can network, post, and connect.

---

## 🚀 Key Features

* **Opportunity Discovery**: Browse, filter, and view details for internships and jobs across categories.
* **Authentication Model**:
  * **Students**: Secure Google sign-in powered by Firebase Authentication.
  * **Admins**: Dedicated administrative authentication with secure hashing/reset flows.
* **Application Management**: Apply to jobs and internships with cover letters and track status (Pending, Accepted, Rejected) in real time.
* **Admin Dashboard**: Post new opportunities, moderate applications, and securely manage system credentials.
* **Social Community (Public Space)**: Netowrk with peers, share text/media posts, add friends, like, comment, and share. Features posting limits based on friend counts to maintain platform quality.
* **Secure Subscription Tiering**: Persists subscription plans (Bronze, Silver, Gold) using a secure Mongoose schema after validating signature and payment via Razorpay.

---

## 🏗️ Architecture Overview

The codebase is split into two main sections:

1. **Frontend (`/internarea`)**: A Next.js (Pages Router) application styled with Tailwind CSS 4, utilizing Redux Toolkit for global client state and Firebase Auth for authentication.
2. **Backend (`/backend`)**: An Express.js REST API using Mongoose models, validating and persisting data securely to MongoDB.

### Repository Structure

```text
interareaInternship/
├── backend/                  # Express REST API
│   ├── Model/                # Mongoose Database Models
│   ├── Routes/               # API Route Handlers
│   ├── middleware/           # Auth and Time-gate Middlewares
│   ├── utils/                # Mailer and helper functions
│   ├── index.js              # Express app entrypoint
│   └── package.json
├── internarea/               # Next.js Pages Router Frontend
│   ├── public/               # Public assets
│   ├── src/                  # Application source
│   │   ├── Feature/          # Redux Slices
│   │   ├── Components/       # Shared layout components (Navbar, Footer)
│   │   ├── pages/            # Next.js Pages
│   │   └── utils/            # Device classification & helpers
│   └── package.json
```

---

## 🛠️ Technology Stack

### Frontend
* **Core Framework**: Next.js 15 (Pages Router), React 19, TypeScript 5
* **State Management**: Redux Toolkit & React Redux
* **Authentication**: Firebase Authentication (Google Auth provider)
* **Styling**: Tailwind CSS v4.0 + PostCSS
* **Visual Elements**: Lucide React & Swiper Carousel
* **HTTP Client**: Axios

### Backend
* **Runtime & Framework**: Node.js & Express.js 4
* **Database**: MongoDB & Mongoose 8
* **Security & Auth**: Firebase Admin SDK (token verification), Crypto scrypt hashes
* **Integrations**: Razorpay Node SDK, Nodemailer (with SMTP support)
* **Development**: Nodemon (as devDependency)

---

## ⚙️ Environment Configuration

Set up configuration files in frontend and backend folders before starting local development.

### Backend Setup (`backend/.env`)

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
DATABASE_URL=mongodb://127.0.0.1:27017/internarea

# Razorpay Keys
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Admin Default Credentials
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@internarea.com
ADMIN_PHONE=9999999999
ADMIN_PASSWORD=your_secure_password

# SMTP Mailer Settings (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_specific_password
SMTP_FROM="InternArea Support" <your_email@gmail.com>
```

### Frontend Setup (`internarea/.env.local`)

Create a `.env.local` file in the `internarea/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000

# Firebase client-side configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

---

## 🚀 Local Development Setup

### 1. Database
Make sure you have MongoDB running locally:
```bash
mongod
```

### 2. Backend Server
Navigate to the backend directory, install dependencies, and start development mode:
```bash
cd backend
npm install
npm run dev
```
The backend server runs by default on `http://localhost:5000`.

### 3. Frontend App
Open a new terminal tab, navigate to the frontend directory, install dependencies, and start:
```bash
cd internarea
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🧪 Verification & Production Build
Ensure that both components are ready for deployment:

* **Backend syntax verification**:
  ```bash
  node -c index.js
  ```
* **Frontend compilation check**:
  ```bash
  npm run build
  ```
