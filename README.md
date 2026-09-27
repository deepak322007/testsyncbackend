# CropCare Backend

Express + MongoDB authentication API with password login, phone verification, and mobile OTP login.

## Requirements

- Node.js 20 or newer
- MongoDB running locally or a MongoDB Atlas connection string

## Setup

```powershell
npm install
Copy-Item .env.example .env
```

Update `.env` with a long `JWT_SECRET` and set `MONGODB_URI` to your MongoDB Atlas connection string. Include the database name in the URI, for example:

```text
mongodb+srv://<db-user>:<url-encoded-password>@cluster0.hrvywta.mongodb.net/cropcare?appName=Cluster0
```

Replace the placeholders without the angle brackets and URL-encode special characters in the password. In Atlas, create a database user and allow your development IP in Network Access. Keep `.env` private and rotate any database password that has been shared publicly. MongoDB creates the `cropcare` database and `users` collection when the first signup is saved. Start the API with:

```powershell
npm run dev
```

The API runs at `http://localhost:5000` by default. The health check is `GET /health`.

## Auth endpoints

- `POST /api/auth/signup` with `{ "name", "email", "phone", "password", "branch", "rank" }`
- `POST /api/auth/verify-phone` with `{ "phone", "otp" }`
- `POST /api/auth/login` with `{ "phone", "password" }`
- `POST /api/auth/request-login-otp` with `{ "phone" }`
- `POST /api/auth/login-with-otp` with `{ "phone", "otp" }`

In development, OTP values are printed to the server console. For production, add Twilio credentials to `.env`, set `SMS_ENABLED=true`, and keep provider credentials in environment variables. OTPs are stored hashed, expire after five minutes by default, and are limited to five verification attempts.
