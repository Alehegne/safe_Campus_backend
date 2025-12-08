# Authentication API Documentation

The Authentication API allows users (specifically students) to register and log in to the system. It handles account creation, login, and trusted contact information.

---

## **1. Register a User**

### **Endpoint**

```
POST /api/auth/register
```

### **Description**

Creates a new user (student) in the system.

### **Authentication**

No authentication required.

---

### **Request Body**

```json
{
  "studentId": "123456",
  "fullName": "John Doe",
  "email": "johndoe@example.com",
  "password": "password123",
  "role": "student",
  "trustedContacts": [
    {
      "name": "Jane Doe",
      "phone": "1234567890",
      "email": "janedoe@example.com",
      "relationShip": "friend"
    }
  ],
  "location": {
    "type": "Point",
    "coordinates": [38.80895765457167, 8.891288891174664]
  },
  "addressDescription": "Dorm 1"
}
```

---

### **Request Body Fields**

| Field                            | Type   | Required | Description                                           |
| -------------------------------- | ------ | -------- | ----------------------------------------------------- |
| `studentId`                      | string | Yes      | Unique student identifier.                            |
| `fullName`                       | string | Optional | Full name of the student.                             |
| `email`                          | string | Yes      | User email. Must be unique.                           |
| `password`                       | string | Yes      | Password for user account.                            |
| `deviceToken`                    | string | Yes      | Token used for push notifications.                    |
| `role`                           | string | Optional | User role. Must be `"student"`. Default: `"student"`. |
| `trustedContacts`                | array  | Optional | Array of trusted contact objects.                     |
| `trustedContacts[].name`         | string | Yes      | Contact name.                                         |
| `trustedContacts[].phone`        | string | Yes      | Contact phone number.                                 |
| `trustedContacts[].email`        | string | Yes      | Contact email.                                        |
| `trustedContacts[].relationShip` | string | Yes      | Relationship type (friend, roommate, etc.).           |
| `location`                       | object | Optional | GeoJSON location.                                     |
| `location.type`                  | string | Yes      | Must be `"Point"`.                                    |
| `location.coordinates`           | array  | Yes      | Coordinates in `[longitude, latitude]`.               |
| `addressDescription`             | string | Optional | Short description of the user’s address.              |

---

### **Success Response (201)**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "_id": "645c0e1234567890abcdef12",
    "studentId": "123456",
    "email": "johndoe@example.com",
    "role": "student"
  }
}
```

### **Error Responses**

#### **400 - Duplicate User**

```json
{
  "success": false,
  "message": "User with this email or student id already exists."
}
```

#### **500 - Server Error**

```json
{
  "success": false,
  "message": "Server error"
}
```

---

## **2. Log In a User**

### **Endpoint**

```
POST /api/auth/login
```

### **Description**

Allows a user to log in using email and password.

### **Authentication**

Not required.

---

### **Request Body**

```json
{
  "email": "johndoe@example.com",
  "deviceToken": "device_token_123",
  "password": "password123"
}
```

---

### **Request Body Fields**

| Field      | Type   | Required | Description         |
| ---------- | ------ | -------- | ------------------- |
| `email`    | string | Yes      | User email address. |
| `password` | string | Yes      | User password.      |

---

### **Success Response (200)**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "_id": "645c0e1234567890abcdef12",
      "studentId": "123456",
      "fullName": "John Doe",
      "email": "johndoe@example.com",
      "role": "student",
      "trustedContacts": [
        {
          "name": "Jane Doe",
          "phone": "1234567890",
          "email": "janedoe@example.com",
          "relationShip": "friend"
        }
      ],
      "location": {
        "type": "Point",
        "coordinates": [38.80895765457167, 8.891288891174664]
      },
      "addressDescription": "Dorm 1"
    }
  }
}
```

---

### **Error Responses**

#### **401 – User Not Registered**

```json
{
  "success": false,
  "message": "please register first"
}
```

#### **403 – Missing Credentials**

```json
{
  "success": false,
  "message": "please provide email and password"
}
```

#### **500 – Server Error**

```json
{
  "success": false,
  "message": "Server error"
}
```

---
