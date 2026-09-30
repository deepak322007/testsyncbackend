const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema(
  {
    recordId: { type: String, required: true, unique: true, index: true },
    timestampMs: { type: Number, required: true },
    operatorId: { type: String, default: '' },
    operatorName: { type: String, default: '' },
    operatorEmail: { type: String, required: true, index: true, lowercase: true, trim: true },
    agency: { type: String, default: '' },
    kitId: { type: String, required: true },
    kitName: { type: String, required: true },
    targetSubstance: { type: String, required: true },
    resultCategory: { type: String, enum: ['POSITIVE', 'NEGATIVE', 'INCONCLUSIVE'], required: true },
    confidencePercent: { type: Number, required: true },
    notes: { type: String, default: '' },
    latitude: { type: Number, default: 0.0 },
    longitude: { type: Number, default: 0.0 },
    locationAccuracy: { type: Number, default: 0.0 },
    locationName: { type: String, default: 'Unknown Location' },
    imageHashSha256: { type: String, required: true },
    rawRgbHex: { type: String, default: '#FFFFFF' },
    calibratedRgbHex: { type: String, default: '#FFFFFF' },
    calibrationLightingQuality: { type: String, default: 'GOOD' },
    digitalSignature: { type: String, default: '' },
    keyFingerprint: { type: String, default: '' },
    syncedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Record', recordSchema);
