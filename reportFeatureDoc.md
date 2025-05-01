SafeCampus API Documentation
#5 Report Incident Feature

---

Base URL

https://your-domain.com/api


---

Authentication Middleware (Required for all routes unless stated)

verifyToken: Validates JWT for authentication

role.middleware (Optional): Can restrict access by user role (e.g., admin only)



---

INCIDENT ENDPOINTS

POST /report

> Upload a new incident report with optional image



Headers:

Authorization: Bearer <token>


Body (multipart/form-data):

image: [jpeg, jpg, png] (optional)

description: string

location: { type: 'Point', coordinates: [lng, lat] }

tags: array of strings


Rate Limit:

Limited to X reports per user/IP per minute (defined in rateLimiter.js)



---

GET /incidents

> Get all incidents (recent first)



Headers:

Authorization: Bearer <token>


Response:

Array of incidents with metadata (description, location, status, tags, media, etc.)



---

GET /incidents/media

> Get only incident media (images)



Headers:

Authorization: Bearer <token>



---

GET /incidents/locations

> Get locations of recent incidents



Headers:

Authorization: Bearer <token>



---

GET /incidents/filter

> Filter incidents by tags or custom queries



Query Parameters:

tags, status, dateRange, etc.


Headers:

Authorization: Bearer <token>



---

GET /incidents/pending

> Get only pending (unresolved) incidents



Headers:

Authorization: Bearer <token>



---

PATCH /incidents/:id

> Update status of an incident



Headers:

Authorization: Bearer <token>


Body:

{ status: "resolved" | "pending" | ... }


Note:

Calls updateSingleCache() to ensure cache stays consistent



---

DELETE /incidents/:id

> Delete an incident (admin only)



Headers:

Authorization: Bearer <token>


Note:

Ensure role.middleware.js is used if needed to limit to admins

Calls deleteCache() utility to remove incident from cache



---

GET /incidents/near?near=lat,lng

> Get incidents within 1km radius from given coordinates



Query:

near=lat,lng


Headers:

Authorization: Bearer <token>



---

UTILITIES

Cloudinary (Image Storage)

Configured with .env keys:


CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

Folder: SafeCampus

Allowed Formats: jpeg, jpg, png


Multer (CloudinaryStorage)

Used in uploadRoute

Accepts only single file named image



---

MIDDLEWARE

verifyToken.js

Decodes JWT and attaches user to req.user


role.middleware.js

Restricts access by user role (e.g., admin only)


rateLimiter.js

Controls frequency of upload/report requests



---

CACHING

cacheHelper.js

updateSingleCache(incident, IncidentModel)

deleteCache(id)


Ensures consistent frontend state after updates or deletions.


---

ERROR HANDLING

Global

404 handler for unknown routes

500 handler for internal server errors



---

OTHER DEPENDENCIES

express

mongoose

dotenv

cors

helmet

morgan

multer

multer-storage-cloudinary

cloudinary

express-rate-limit

jsonwebtoken



---

SETUP

1. Clone the repo


2. Create .env file:



PORT=5000
MONGO_URI=your_mongodb_uri
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
JWT_SECRET=your_jwt_secret

3. Run:



npm install
npm start


---

NOTE

All routes are prefixed with /api

Frontend must attach JWT token to Authorization header for protected routes



