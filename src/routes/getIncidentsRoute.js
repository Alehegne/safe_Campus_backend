const express = require('express');
const router = express.Router();
const {
    getIncidents,
    getMedias,
    getLocations,
    filteredIncidents,
    filteredIncidentsByStatus
} = require('./src/controllers/getIncidents');
const verifyToken = require('./src/middlewares/verifyToken');
const checkRole = require('./src/middlewares/role.middleware');

router.get('/incidents', verifyToken, getIncidents);
router.get('/incidents/media', verifyToken, getMedias);
router.get('/incidents/locations', verifyToken, getLocations);
router.get('/incidents/filter', verifyToken, filteredIncidents);
router.get('/incidents/pending', verifyToken, checkRole(['admin', 'moderator']), filteredIncidentsByStatus);

module.exports = router;