const mongoose = require('mongoose');
const Incidents = require('./src/models/incidentModel');
const { deleteCache } = require('./src/utils/cacheHelper');

const deleteIncident = async (req, res) => {
    try {
        const incidentId = req.params.id;
        if (!incidentId) {
            return res.status(400).json({ message: 'No id provided' });
        }

        const findIncident = await Incidents.findByIdAndDelete(incidentId);
        if (!findIncident) {
            return res.status(404).json({ message: 'Incident not found' });
        }

        await deleteCache(incidentId);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
        console.log(err);
    }
};

module.exports = deleteIncident;