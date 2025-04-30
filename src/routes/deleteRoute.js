const express = require('express');
const router = express.Router();
const deleteIncident = require('./src/controllers/deleteIncident');
const updateStatus = require('./src/controllers/updateIncidentStatus');
const verifyToken = require('./src/middlewares/verifyToken');
const roleMiddleware = require('./src/middlewares/role.middleware');

router.delete('/api/incidents/:id', verifyToken, roleMiddleware, deleteIncident);
router.patch('/api/incidents/:id', verifyToken, roleMiddleware, updateStatus);

module.exports = router;