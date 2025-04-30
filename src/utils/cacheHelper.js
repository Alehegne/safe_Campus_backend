const mongoose = require('mongoose');
const NodeCache = require('node-cache');
const cache = new NodeCache();
const loadCacheFromDb = async (Incidents)=>{
    const allIncidents = await Incidents.find().sort({ createdAt: -1});
    cache.set('allIncidents', allIncidents);

    const mediaCache = allIncidents.map(incident => ({
        description: incident.description,
        location: incident.location,
        date: incident.createdAt,
        evidenceImage: incident.evidenceImage
    }));
    cache.set('mediaCache', mediaCache);

    const locationCache = allIncidents.map(incident => ({
        description: incident.description,
        date: incident.createdAt,
        location: incident.location
    }));
    cache.set('locationCache', locationCache)

    const pendingIncidentsCache = allIncidents.filter( incident=> incident.status === 'pending');
    cache.set('pendingIncidentsCache', pendingIncidentsCache);
}
const getIncidentCache = async (Incidents)=>{
    let cachedIncidents = cache.get('allIncidents');
    let cachedMedia = cache.get('mediaCache');
    let cachedLocation = cache.get('locationCache');
    let pendingIncidentsCache = cache.get('pendingIncidentsCache');
    if(!cachedIncidents){
        await loadCacheFromDb(Incidents);
        cachedIncidents = cache.get('allIncidents');
        cachedMedia = cache.get('mediaCache');
        cachedLocation = cache.get('locationCache');
        pendingIncidentsCache = cache.get('pendingIncidentsCache');
        
    }
    return { cachedIncidents, cachedMedia, cachedLocation, pendingIncidentsCache }
}
const updateIncidentCache = async (newIncident, Incidents)=>{
    let cachedIncidents = cache.get('allIncidents') || [];
    let cachedMedia = cache.get('mediaCache') || [];
    let cachedLocations = cache.get('locationCache') || [];
    let pendingIncidentsCache = cache.get('pendingIncidentsCache') || [];
    if(!cachedIncidents){
        await loadCacheFromDb(Incidents);
        cachedIncidents = cache.get('allIncidents') || [];
        cachedMedia = cache.get('mediaCache') || [];
        cachedLocations = cache.get('locationCache') || [];
        pendingIncidentsCache = cache.get('pendingIncidentsCache') || [];
    }
    cachedIncidents.unshift(newIncident);  
    cachedMedia.unshift({
        description: newIncident.description,
        location: newIncident.location,
        date: newIncident.createdAt,
        evidenceImage: newIncident.evidenceImage
    });
    cachedLocations.unshift({
        description: newIncident.description,
        date: newIncident.createdAt,
        location: newIncident.location
    });
    if (newIncident.status === 'pending') {
        pendingIncidentsCache.unshift(newIncident);
        
    }
    cache.set('allIncidents', cachedIncidents);
    cache.set('mediaCache', cachedMedia);
    cache.set('locationCache', cachedLocations);
    cache.set('pendingIncidentsCache', pendingIncidentsCache);
}
const updateSingleCache = async (updatedIncident, Incidents)=>{
    let cachedIncidents = cache.get('allIncidents');
    if(!cachedIncidents){
        await loadCacheFromDb(Incidents);
        cachedIncidents = cache.get('allIncidents');
    }
    const updatedIncidents = cachedIncidents.map( incident=>{ if( incident._id.toString() === updatedIncident._id.toString()){
        return updatedIncident;
    }
       return incident; 
    });
    cache.set('allIncidents', updatedIncidents);
}
const deleteCache = async (incidentId)=>{
    let cachedIncidents = cache.get('allIncidents') || [];
    let cachedMedia = cache.get('mediaCache') || [];
    let cachedLocations = cache.get('locationCache') || [];
    let pendingIncidentsCache = cache.get('pendingIncidentsCache') || [];
    const idStr =incidentId.toString();
    const allIncidents = cachedIncidents.filter( incident=>incident._id.toString() !== idStr);
    const mediaCache = cachedMedia.filter( incident=>incident._id.toString() !== idStr)
    const locationCache = cachedLocations.filter( incident=>incident._id.toString() !== idStr)
    pendingIncidentsCache = pendingIncidentsCache.filter( incident=>incident._id.toString() !== idStr)
    cache.set('allIncidents', allIncidents);
    cache.set('mediaCache', mediaCache);
    cache.set('locationCache', locationCache);
    cache.set('pendingIncidentsCache', pendingIncidentsCache);
}
module.exports = { loadCacheFromDb, getIncidentCache, updateIncidentCache, updateSingleCache, deleteCache }