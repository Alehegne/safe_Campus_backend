const mongoose = require('mongoose');
const Incidents = require('./src/models/incidentModel');

const nearIncidents = async (req, res) => {
    try {
        const timePeriod = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const [lat, lng] = req.query.near?.split(',').map(parseFloat);

        if (!lat || !lng) {
            return res.status(400).json({ message: 'Coordinates not provided' });
        }

        const incidents = await Incidents.find({
            reportedAt: { $gte: timePeriod },
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    },
                    $maxDistance: 1000
                }
            }
        });

        if (!incidents || incidents.length === 0) {
            return res.status(404).json({ message: 'No recent incidents in 1km radius' });
        }

        res.json({ success: true, message: 'Found incidents in 1km radius', incidents });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
        console.log(err);
    }
};

module.exports = nearIncidents;