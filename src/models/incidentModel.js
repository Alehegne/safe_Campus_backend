const mongoose = require('mongoose');
const numberSchema = new mongoose.Schema({
    longitude: { type: Number, required: true},
    latitude: { type: Number, required: true}
});
const incidentSchema = new mongoose.Schema({
    description:{ type: String, required: true},
    reporterId: { type: mongoose.Schema.Type.ObjectId, ref: 'User' },
    location: { 
        type:{
            type: String,
            enum: ['Point'],
            required: true },
        coordinates:{ 
            type: [Number],
            required: true 
        }
    },
    anonymous: { type: Boolean, default: false },
    evidenceImage: String,
    createdAt: { type: Date, default: Date.now},
    tags: {
        type: [String],
        required: true
    },
    status: {
        type: String,
        enum: ['pending','resolved'],
        default: 'pending'
    }
})
incidentSchema.index({location: '2dsphere'});
module.exports = mongoose.model('Incidents', incidentSchema);