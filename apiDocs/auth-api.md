# Authentication API Documentation

## Base URL
```
/api/auth
```

## Authentication
No authentication required for these endpoints.

## Endpoints

### Register User
Register a new user in the system.

**Endpoint:** `POST /register`

**Request Body:**
```json
{
  "email": "string",
  "password": "string",
  "fullName": "string",
  "studentId": "string", // Required for student role
  "role": "string", // Optional, defaults to "student"
  "deviceToken": "string", // Required for push notifications
  "location": {
    "type": "Point",
    "coordinates": [number, number] // [longitude, latitude]
  },
  "addressDescription": "string", // Optional, e.g., "Dorm1", "Dorm2"
  "trustedContacts": [
    {
      "name": "string",
      "phone": "string",
      "email": "string",
      "relationShip": "friend" | "roommate" | "colleague" | "other" // Optional, defaults to "friend"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "_id": "string",
    "studentId": "string",
    "email": "string",
    "role": "string"
  }
}
```

**Error Responses:**
- `400 Bad Request`: 
  - Invalid input data
  - Missing required fields
  - User with email or student ID already exists
  - Student ID is required for student role
  - Device token is required
- `500 Internal Server Error`: Server error

### Login User
Authenticate a user and get access token.

**Endpoint:** `POST /login`

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "string",
    "user": {
      "_id": "string",
      "studentId": "string",
      "email": "string",
      "fullName": "string",
      "role": "string",
      "deviceToken": "string",
      "location": {
        "type": "Point",
        "coordinates": [number, number]
      },
      "addressDescription": "string",
      "trustedContacts": [
        {
          "name": "string",
          "phone": "string",
          "email": "string",
          "relationShip": "string"
        }
      ],
      "createdAt": "string",
      "updatedAt": "string"
    }
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing email or password
- `401 Unauthorized`: 
  - Invalid email or password
  - User not registered
- `500 Internal Server Error`: Server error

## Notes
- All requests should include `Content-Type: application/json` header
- The access token should be included in the `Authorization` header for protected routes
- Token format: `Bearer <token>`
- Student registration requires a valid student ID
- The system supports multiple roles: student, admin, campus_security
- Device token is required for push notifications
- Location coordinates should be provided in [longitude, latitude] format
- Trusted contacts can have different relationship types: friend, roommate, colleague, other
- Timestamps are in ISO 8601 format 