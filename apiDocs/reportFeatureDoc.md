# **Report API Documentation**

This API allows users to report incidents, retrieve reports, filter nearby incidents, and manage report statuses. Authentication using a token is required for all endpoints.

---

## **1. Report an Incident**

### **Endpoint**

```
POST /api/report
```

### **Description**

Submit an incident report with optional evidence (image) and tags.

### **Authentication**

Token required in the header.

---

### **Request Body**

```json
{
  "description": "Incident description",
  "anonymous": true,
  "tags": "tag",
  "image": "actual image file",
  "location": {
    "type": "Point",
    "coordinates": [38.80895765457167, 8.891288891174664]
  }
}
```

### **Request Body Fields**

| Field                  | Type    | Required | Description                                       |
| ---------------------- | ------- | -------- | ------------------------------------------------- |
| `description`          | string  | Yes      | Details about the incident.                       |
| `anonymous`            | boolean | No       | Whether the report hides the reporter's identity. |
| `tags`                 | string  | No       | A single tag describing the incident.             |
| `image`                | file    | No       | Evidence image file.                              |
| `location`             | object  | Yes      | GeoJSON object representing location.             |
| `location.type`        | string  | Yes      | Must be `"Point"`.                                |
| `location.coordinates` | array   | Yes      | `[longitude, latitude]`.                          |

---

### **Success Response (200)**

```json
{
  "success": true,
  "message": "Incident reported successfully",
  "data": {
    "_id": "645c0e1234567890abcdef12",
    "description": "Incident description",
    "anonymous": true,
    "tags": "tag1",
    "location": {
      "type": "Point",
      "coordinates": [38.80895765457167, 8.891288891174664]
    },
    "evidenceImage": "https://cloudinary.com/image.jpg",
    "reporterId": "645b9f1234567890abcdef34"
  }
}
```

### **Error Response (400)**

```json
{
  "success": false,
  "message": "Incomplete form",
  "error": "Please fill in all required fields"
}
```

---

## **2. Get All Reports**

### **Endpoint**

```
GET /api/reports
```

### **Description**

Retrieve all reports with optional pagination and filters.

### **Authentication**

Token required.

---

### **Query Parameters**

| Parameter    | Type   | Description                                           |
| ------------ | ------ | ----------------------------------------------------- |
| `page`       | number | Page number (default: 1).                             |
| `limit`      | number | Items per page (default: 15).                         |
| `status`     | string | Filter by status (`pending`, `resolved`, `rejected`). |
| `reporterId` | string | Filter by user ID.                                    |
| `tags`       | string | Comma-separated tag filter.                           |

---

### **Success Response (200)**

```json
{
  "success": true,
  "message": "Reports retrieved successfully",
  "data": {
    "reports": [
      {
        "_id": "645c0e1234567890abcdef12",
        "description": "Incident description",
        "anonymous": true,
        "tags": "tags",
        "location": {
          "type": "Point",
          "coordinates": [38.80895765457167, 8.891288891174664]
        },
        "evidenceImage": "https://cloudinary.com/image.jpg",
        "reporterId": "645b9f1234567890abcdef34"
      }
    ],
    "analysis": {
      "totalReports": 100,
      "totalPages": 10,
      "currentPage": 1,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

### **Error Response (500)**

```json
{
  "success": false,
  "message": "Error getting reports"
}
```

---

## **3. Get Nearby Incidents**

### **Endpoint**

```
GET /api/reports/near
```

### **Description**

Fetch incidents within a 1km radius of a given location.

### **Authentication**

Token required.

---

### **Query Parameters**

| Parameter    | Type   | Required | Description                                           |
| ------------ | ------ | -------- | ----------------------------------------------------- |
| `near`       | string | Yes      | `"latitude,longitude"` format.                        |
| `timePeriod` | number | No       | Time window in milliseconds (default: last 48 hours). |

---

### **Success Response (200)**

```json
{
  "success": true,
  "message": "Found incidents in 1km radius",
  "data": [
    {
      "_id": "645c0e1234567890abcdef12",
      "description": "Incident description",
      "location": {
        "type": "Point",
        "coordinates": [38.80895765457167, 8.891288891174664]
      },
      "tags": ["tag1", "tag2"]
    }
  ]
}
```

### **Error Response (404)**

```json
{
  "success": false,
  "message": "No recent incidents in 1km radius"
}
```

---

## **4. Get Report by ID**

### **Endpoint**

```
GET /api/reports/:id
```

### **Description**

Retrieve detailed information of a specific report.

### **Authentication**

Token required.

### **Authorization**

Admin or campus security roles only.

---

### **Request Parameters**

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| `id`      | string | Yes      | Report ID.  |

---

### **Success Response (200)**

```json
{
  "success": true,
  "message": "Report retrieved successfully",
  "data": {
    "_id": "645c0e1234567890abcdef12",
    "description": "Incident description",
    "anonymous": true,
    "tags": "tag",
    "location": {
      "type": "Point",
      "coordinates": [38.80895765457167, 8.891288891174664]
    },
    "evidenceImage": "https://cloudinary.com/image.jpg",
    "reporterId": "645b9f1234567890abcdef34"
  }
}
```

### **Error Response (404)**

```json
{
  "success": false,
  "message": "Report not found"
}
```

---

## **5. Delete a Report**

### **Endpoint**

```
DELETE /api/reports/:id
```

### **Description**

Delete a specific report by its ID.

### **Authentication**

Token required.

### **Authorization**

Admin or campus security only.

---

### **Request Parameters**

| Parameter | Type   | Required | Description       |
| --------- | ------ | -------- | ----------------- |
| `id`      | string | Yes      | ID of the report. |

---

### **Success Response (200)**

```json
{
  "success": true,
  "message": "Report deleted successfully"
}
```

### **Error Response (404)**

```json
{
  "success": false,
  "message": "Report not found"
}
```

---

## **6. Update Report Status**

### **Endpoint**

```
PATCH /api/reports/:id/status
```

### **Description**

Update the status of an incident report.

### **Authentication**

Token required.

### **Authorization**

Admin or campus security only.

---

### **Request Parameters**

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| `id`      | string | Yes      | Report ID.  |

---

### **Request Body**

```json
{
  "status": "resolved"
}
```

### **Allowed Status Values**

- `resolved`
- `pending`
- `rejected`

---

### **Success Response (200)**

```json
{
  "success": true,
  "message": "Report status updated successfully",
  "data": {
    "_id": "645c0e1234567890abcdef12",
    "status": "resolved"
  }
}
```

### **Error Response (400)**

```json
{
  "success": false,
  "message": "Invalid status"
}
```
