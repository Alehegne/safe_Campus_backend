# Safe Campus Backend

The Safe Campus Backend is a robust, Node.js and Express.js based RESTful API and WebSocket server designed to support a campus safety application. It provides essential features to ensure student safety, including real-time panic alerts, incident reporting, route tracking, and danger zone management.

##  Features

- **Authentication & Authorization**: Secure JWT-based authentication supporting multiple roles (students, campus security, and administrators).
- **Trusted Contacts Management**: Users can add, update, and remove trusted contacts who receive notifications during emergencies.
- **Real-Time Panic/SOS Alerts**: WebSocket-powered (Socket.io) real-time SOS broadcasting to nearby security and trusted contacts.
- **Incident Reporting**: Allows users to submit reports with media attachments uploaded securely to Cloudinary.
- **Route Tracking**: Tracks user routes on campus to monitor safety.
- **Danger Area Management**: Identifies and alerts users about designated risk zones on campus.
- **Push Notifications & Emails**: Integrates Firebase Admin for push notifications and Nodemailer for critical email alerts.

##  Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **Real-time Communication**: Socket.io
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs
- **File Uploads**: Multer & Cloudinary
- **Email Services**: Nodemailer
- **Validation**: Joi
- **Security**: Helmet, Express Rate Limit, CORS

##  Folder Structure

```
├── apiDocs/           # Detailed Markdown API documentation
├── src/
│   ├── app.js         # Express app setup and global middlewares
│   ├── config/        # Configurations (DB, Cloudinary, Firebase, Sockets)
│   ├── controllers/   # Request handlers for routes
│   ├── middleware/    # Custom middlewares (e.g., JWT verification, logging)
│   ├── models/        # Mongoose database schemas
│   ├── routes/        # Express route definitions
│   ├── services/      # Core business logic
│   ├── sockets/       # Socket.io event handlers and middlewares
│   └── utils/         # Helper functions (emails, token generation, responses)
├── server.js          # Entry point of the application
└── package.json       # Dependencies and scripts
```

##  Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Alehegne/safe_Campus_backend.git
   cd safe_Campus_backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

##  Environment Variables

Create a `.env` file in the root directory and configure the following environment variables. The application relies on these to function properly.

```env
# Server Config
PORT=8000
NODE_ENV=development

# Database Config
MONGO_DB_URL=your_mongodb_connection_string

# JWT & Authentication
JWT_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRATION=7d
RESPONSE_TOKEN_SECRET=your_response_token_secret

# Cloudinary (Image Uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Configuration (Nodemailer)
EMAIL_USER=your_email_address
EMAIL_PASS=your_email_password

# Firebase Admin (Push Notifications)
FIREBASE_CONFIG_BASE64=your_base64_encoded_firebase_service_account_json
```

##  Running the Project

**Development Mode (with auto-reload):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

##  Database Information

The project uses **MongoDB** as its database, interfaced via **Mongoose**. 
The connection logic is handled in `src/config/dbConnection.js`. 
Key collections include `Users`, `Alerts`, `DangerAreas`, `Incidents`, `PanicEvents`, and `Routes`.

##  Security & Authentication

- **Strategy**: Authentication is handled via Bearer Tokens (JWT).
- **Middleware**: Protected routes utilize the `verifyToken` middleware (`src/middleware/verifyToken.js`), which verifies the presence and validity of the JWT in the `Authorization` header.
- **Roles**: The system supports Role-Based Access Control for `student`, `campus_security`, and `admin`.

##  API Documentation

Comprehensive API documentation is available in the `apiDocs/` directory. These Markdown files document the request/response structures, parameters, and endpoints for specific modules:

- `auth-api.md`: Authentication, Registration, and Trusted Contacts
- `panic-alert-api.md`: SOS and Emergency Alerts
- `profile-api.md`: User Profile Management
- `reportFeatureDoc.md`: Incident Reporting
- `risk_zone_api.md`: Danger Area mapping
- `route-tracking-api.md`: Tracking paths and journeys
- `websocket-api.md`: Socket.io event references

### Main API Modules
- `/api/auth` - User login, registration, token refresh, and trusted contacts.
- `/api/profile` - Profile updates and retrieval.
- `/api/routes` - Safe route tracking.
- `/api/sos` - Panic alert triggering and management.
- `/api/report` - Incident report submissions.
- `/api/dangerArea` - Fetching and managing high-risk zones.
- `/api/users` - Admin user management.
- `/api/admin` - Administrative analytics.
- `/api/notification` - Alert notifications.

### Standard Response Format
The API utilizes a standardized response utility (`src/utils/sendResponse.js`) yielding the following JSON structure:

```json
{
  "success": true,
  "message": "Human-readable message here",
  "data": { ... } // Payload (omitted on failure or populated with error details)
}
```

##  Error Handling Strategy

The application uses a centralized error-handling strategy in `src/app.js`. 
- Unmatched routes fall through to a 404 handler.
- Application errors are caught and passed to a global error middleware that returns a standardized `500` error payload, including the stack trace if the environment is not set to production.

##  Logging

Logging is implemented globally via `src/middleware/globalLogger.js`. Request details are monitored to aid in debugging and server health checks.

##  License

ISC License. See `package.json` for details.
