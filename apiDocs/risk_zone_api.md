# **Danger Area API Documentation**

The Danger Area API allows users to interact with dangerous zones on the map. It supports fetching dangerous areas, creating new risk zones, and deleting existing zones.
Authentication is required for all endpoints, and some operations are restricted to privileged roles.

---

# **1. Get All Dangerous Areas**

### **Endpoint**

```
GET /api/danger-area
```

### **Description**

Retrieve a list of dangerous areas with optional filtering and pagination.

### **Authentication**

Token required in the header.

---

### **Query Parameters**

| Parameter  | Type   | Description                                                              |
| ---------- | ------ | ------------------------------------------------------------------------ |
| `page`     | number | Page number (default: 1).                                                |
| `limit`    | number | Number of records per page (default: 15).                                |
| `status`   | string | Filter by zone status: `active`, `under investigation`, `resolved`.      |
| `types`    | string | Comma-separated incident types: e.g., `theft,assault`.                   |
| `severity` | string | Zone severity: `low`, `medium`, `high`.                                  |
| `source`   | string | Report source: `user`, `admin`, `campus_security`, `anonymous`, `other`. |

---

### **Success Response (200)**

```json
{
  "success": true,
  "message": "successfully fetched dangerous area",
  "data": [
    {
      "_id": "645c0e1234567890abcdef12",
      "location": {
        "type": "Point",
        "coordinates": [38.80895765457167, 8.891288891174664]
      },
      "severity": "high",
      "reportCount": 5,
      "reports": ["645b9f1234567890abcdef34"],
      "source": ["user"],
      "status": "active",
      "types": ["theft", "assault"],
      "lastReportedAt": "2025-05-02T12:00:00.000Z"
    }
  ]
}
```

### **Error Response (400)**

```json
{
  "success": false,
  "message": "error in fetching dangerous area"
}
```

---

# **2. Create a Risk Zone**

### **Endpoint**

```
POST /api/danger-area
```

### **Description**

Allows admins or campus security to create a new danger/risk zone.

### **Authentication**

Token required.

### **Authorization**

Only users with roles:

- `admin`
- `campus_security`

---

### **Request Body**

```json
{
  "location": {
    "type": "Point",
    "coordinates": [38.80895765457167, 8.891288891174664]
  },
  "severity": "high",
  "types": ["theft", "assault"]
}
```

### **Request Body Fields**

| Field                  | Type   | Required | Description                           |
| ---------------------- | ------ | -------- | ------------------------------------- |
| `location`             | object | Yes      | GeoJSON location object.              |
| `location.type`        | string | Yes      | Must be `"Point"`.                    |
| `location.coordinates` | array  | Yes      | `[longitude, latitude]`.              |
| `severity`             | string | Yes      | One of: `low`, `medium`, `high`.      |
| `types`                | array  | Yes      | Incident types assigned to this zone. |

---

### **Success Response (200)**

```json
{
  "success": true,
  "message": "risk zone successfully saved",
  "data": {
    "_id": "645c0e1234567890abcdef12",
    "location": {
      "type": "Point",
      "coordinates": [38.80895765457167, 8.891288891174664]
    },
    "severity": "high",
    "reportCount": 1,
    "source": ["admin"],
    "status": "active",
    "types": ["theft", "assault"],
    "lastReportedAt": "2025-05-02T12:00:00.000Z"
  }
}
```

### **Error Response (400)**

```json
{
  "success": false,
  "message": "error in creating risk zone"
}
```

---

# **3. Delete a Risk Zone**

### **Endpoint**

```
DELETE /api/danger-area/:id
```

### **Description**

Delete a specific risk zone by its ID.

### **Authentication**

Token required.

### **Authorization**

Only `admin` or `campus_security` roles.

---

### **Request Parameters**

| Parameter | Type   | Required | Description                      |
| --------- | ------ | -------- | -------------------------------- |
| `id`      | string | Yes      | ID of the danger area to delete. |

---

### **Success Response (200)**

```json
{
  "success": true,
  "message": "deleted successfully",
  "data": {
    "_id": "645c0e1234567890abcdef12",
    "location": {
      "type": "Point",
      "coordinates": [38.80895765457167, 8.891288891174664]
    },
    "severity": "high",
    "reportCount": 1,
    "source": ["admin"],
    "status": "active",
    "types": ["theft", "assault"],
    "lastReportedAt": "2025-05-02T12:00:00.000Z"
  }
}
```

### **Error Response (400)**

```json
{
  "success": false,
  "message": "error in deleting risk zone"
}
```

---

# **Danger Area Data Model**

The `DangerArea` model defines how dangerous zones are stored in the database.

---

## **Schema Fields**

| Field                  | Type   | Description                                                        |
| ---------------------- | ------ | ------------------------------------------------------------------ |
| `location`             | object | GeoJSON location object.                                           |
| `location.type`        | string | Must be `"Point"`.                                                 |
| `location.coordinates` | array  | `[longitude, latitude]`.                                           |
| `severity`             | string | Zone severity: `low`, `medium`, `high`.                            |
| `reportCount`          | number | Count of reports linked to this zone (default: 1).                 |
| `reports`              | array  | Array of report IDs.                                               |
| `source`               | array  | Sources: `user`, `admin`, `campus_security`, `anonymous`, `other`. |
| `status`               | string | Status: `active`, `under investigation`, `resolved`.               |
| `types`                | array  | Types of incidents: e.g., `["theft", "assault"]`.                  |
| `lastReportedAt`       | date   | Timestamp of latest linked report.                                 |

---

## **Indexes**

- **location** → `2dsphere index` for geospatial queries.
- **tags** → Indexed for fast tag filtering.
