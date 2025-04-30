const mongoose = require('mongoose');
const Incidents = require('./src/models/incidentModel');
const { updateSingleCache } = require('./src/utils/cacheHelper');

const updateIncidentStatus = async (req, res) => {
    try {
        const incidentId = req.params.id;
        if (!incidentId) {
            return res.status(400).json({ message: 'No id provided' });
        }

        const { status: newStatus } = req.body;
        if (!newStatus) {
            return res.status(400).json({ message: 'Status is empty' });
        }

        const updatedIncident = await Incidents.findOneAndUpdate(
            { _id: incidentId },
            { status: newStatus },
            { new: true }
        );

        if (!updatedIncident) {
            return res.status(404).json({ message: 'Incident not found' });
        }

        await updateSingleCache(updatedIncident, Incidents);
        res.json({ success: true, updatedIncident });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
        console.log(err);
    }
};

module.exports = updateIncidentStatus;