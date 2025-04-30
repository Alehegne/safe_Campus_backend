const mongoose = require('mongoose');
const Incidents = require('./src/models/incidentModel');
const { getIncidentCache } = require('./src/utils/cacheHelper');

const getIncidents = async (req, res) => {
    try {
        const { cachedIncidents } = await getIncidentCache(Incidents);
        res.json({ success: true, cachedIncidents });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

const getMedias = async (req, res) => {
    try {
        const { cachedMedia } = await getIncidentCache(Incidents);
        res.json({ success: true, cachedMedia });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

const getLocations = async (req, res) => {
    try {
        const { cachedLocation } = await getIncidentCache(Incidents);
        res.json({ success: true, cachedLocation });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

const filterIncidentsByTags = async (req, res) => {
    try {
        const tagsQuery = req.query.tags;
        if (!tagsQuery) {
            return res.status(400).json({ message: 'No tags provided' });
        }

        const { cachedIncidents } = await getIncidentCache(Incidents);
        const queryTags = tagsQuery.split(',').map(tag => tag.trim());

        const filteredIncidents = cachedIncidents.filter(incident =>
            incident.tags && incident.tags.some(tag => queryTags.includes(tag))
        );

        res.json({ success: true, filteredIncidents });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

const filteredIncidentsByStatus = async (req, res) => {
    try {
        const { pendingIncidentsCache } = await getIncidentCache(Incidents);
        res.json({ success: true, pendingIncidentsCache });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getIncidents,
    getMedias,
    getLocations,
    filterIncidentsByTags,
    filteredIncidentsByStatus
};