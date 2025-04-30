const mongoose = require('mongoose');
const Incidents = require('./src/models/incidentModel');
const { updateIncidentCache } = require('./src/utils/cacheHelper');

const uploadToDb = async (req, res) => {
    try {
        const { description, anonymous, taglist, lng, latitude } = req.body;

        if (!description || !taglist || !lng || !latitude) {
            return res.status(400).json({ message: 'Incomplete form' });
        }

        const longitude = parseFloat(lng);
        const lat = parseFloat(latitude);

        if (isNaN(longitude) || isNaN(lat)) {
            return res.status(400).json({ message: 'Invalid coordinates' });
        }

        const tags = taglist.split(',').map(tag => tag.trim());

        const location = {
            type: 'Point',
            coordinates: [longitude, lat] 
        };

        const evidenceImage = req.file?.path;

        const incidentData = {
            description,
            location,
            anonymous,
            evidenceImage,
            tags
        };

        if (!anonymous && req.user) {
            incidentData.reporterId = req.user._id;
        }

        const incident = await Incidents.create(incidentData);
        await updateIncidentCache(incident, Incidents);

        res.json({ success: true, incident });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

module.exports = uploadToDb;