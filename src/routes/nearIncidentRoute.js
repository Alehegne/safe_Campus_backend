const express = require('express');
const router = express.Router();
const nearIncidents = require('./src/controllers/nearIncidents');
const auth = require('../middlewares/verifyToken');
router.get('/incidents/near', auth, nearIncidents);
module.exports = router;