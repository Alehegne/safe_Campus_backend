SafeCampus REST API Documentation
#5 Reporting Incidents Feature
A secure, real-time incident reporting and safety alert backend API for SafeCampus.


---

Base URL

http://your-server-domain.com/api


---

Authentication

Most routes are protected and require JWT authentication via the Authorization header.

Authorization: Bearer <your_token>


---

Endpoints

1. Report an Incident

POST /report

Middleware: verifyToken, rateLimiter, multer (Cloudinary)

FormData Required:

image (jpeg/jpg/png, max size controlled by multer)


Body:


{
  "description": "string",
  "anonymous": true,
  "latitude": "number",
  "lng": "number",
  "taglist": "tag1,tag2"
}

Response:


{
  "success": true,
  "Incident": { ... }
}


---

2. Get All Incidents

GET /incidents

Middleware: verifyToken

Response:


{
  "success": true,
  "cachedIncidents": [ ... ]
}


---

3. Get Incident Media

GET /incidents/media

Response:


{
  "success": true,
  "cachedMedia": [ ... ]
}


---

4. Get Incident Locations

GET /incidents/locations

Response:


{
  "success": true,
  "cachedLocations": [ ... ]
}


---

5. Filter Incidents by Tags

GET /incidents/filter?tags=tag1,tag2

Query Params: tags=tag1,tag2

Response:


{
  "success": true,
  "filteredIncidents": [ ... ]
}


---

6. Get Pending Incidents

GET /incidents/pending

Response:


{
  "success": true,
  "pendingIncidentsCache": [ ... ]
}


---

7. Get Nearby Incidents

GET /incidents/near?near=lat,lng

Query Format: near=37.1234,90.5678

Returns incidents within 1km from coordinates

Response:


{
  "success": true,
  "message": "Found incidents in 1km radius",
  "nearIncidents": [ ... ]
}


---

8. Update Incident Status

PATCH /incidents/:id

Middleware: verifyToken

Body:


{
  "status": "resolved" | "pending" | etc
}

Response:


{
  "success": true,
  "newIncident": { ... }
}


---

9. Delete an Incident

DELETE /incidents/:id

Middleware: verifyToken, role check (optional)

Response:


{
  "success": true
}


---

Middleware Summary

verifyToken.js: Validates JWT token.

role.middleware.js: (Optional) Use to restrict access by user role.

rateLimiter.js: Limits report submissions per user/IP.

multer.js: Handles image upload to Cloudinary.



---

Models

Incident Model (incidentModel.js)

{
  description: String,
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: [Number],
  },
  anonymous: Boolean,
  reporterId: mongoose.Schema.Types.ObjectId,
  evidenceImage: String,
  tags: [String],
  status: { type: String, default: 'pending' },
  reportedAt: { type: Date, default: Date.now },
}


---

Utils

cacheHelper.js

updateIncidentCache, getIncidentCache, updateSingleCache, deleteCache, loadCacheFromDb

Ensures Redis-like in-memory cache syncing with DB




---

Environment Variables (.env)

PORT=5000
MONGO_URI=your_mongodb_uri
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_secret
JWT_SECRET=your_jwt_secret


---

Notes for Frontend Team

All request bodies must be in JSON unless uploading media (then use multipart/form-data).

Always attach the Bearer token.

Image uploads should be compressed client-side if possible.

Use filtering and geolocation wisely to reduce bandwidth.

Expect 404 for invalid routes and 500 for internal errors.



---

> Maintained by SafeCampus Backend Team | 2025




