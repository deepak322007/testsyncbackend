const express = require('express');
const Record = require('../models/Record');

const router = express.Router();

/**
 * Cloud Ingestion Endpoint
 * Ingests and stores test records directly into MongoDB Atlas
 */
router.post('/ingest', async (req, res, next) => {
  try {
    const {
      id,
      recordId,
      timestampMs,
      operatorId,
      operatorName,
      operatorEmail,
      userEmail,
      agency,
      kitId,
      kitName,
      targetSubstance,
      resultCategory,
      confidencePercent,
      notes,
      latitude,
      longitude,
      locationAccuracy,
      locationName,
      imageHashSha256,
      rawRgbHex,
      calibratedRgbHex,
      calibrationLightingQuality,
      digitalSignature,
      keyFingerprint
    } = req.body;

    const targetRecordId = recordId || id;
    const targetEmail = (operatorEmail || userEmail || 'unknown@testsync.com').toLowerCase().trim();

    if (!targetRecordId) {
      return res.status(400).json({ message: 'Record ID is required for cloud ingestion' });
    }

    if (!kitId || !resultCategory || !imageHashSha256) {
      return res.status(400).json({ message: 'Kit ID, result category, and image SHA-256 hash are required' });
    }

    const recordData = {
      recordId: targetRecordId,
      timestampMs: timestampMs || Date.now(),
      operatorId: operatorId || '',
      operatorName: operatorName || '',
      operatorEmail: targetEmail,
      agency: agency || '',
      kitId: kitId || 'unknown_kit',
      kitName: kitName || 'Colorimetric Kit',
      targetSubstance: targetSubstance || 'Presumptive Agent',
      resultCategory: String(resultCategory).toUpperCase(),
      confidencePercent: Number(confidencePercent || 0),
      notes: notes || '',
      latitude: Number(latitude || 0.0),
      longitude: Number(longitude || 0.0),
      locationAccuracy: Number(locationAccuracy || 0.0),
      locationName: locationName || 'Unknown Location',
      imageHashSha256: imageHashSha256 || '00000000000000000000000000000000',
      rawRgbHex: rawRgbHex || '#FFFFFF',
      calibratedRgbHex: calibratedRgbHex || '#FFFFFF',
      calibrationLightingQuality: calibrationLightingQuality || 'GOOD',
      digitalSignature: digitalSignature || '',
      keyFingerprint: keyFingerprint || '',
      syncedAt: new Date()
    };

    // Upsert to MongoDB Atlas
    const record = await Record.findOneAndUpdate(
      { recordId: targetRecordId },
      recordData,
      { new: true, upsert: true }
    );

    console.log(`[CLOUD INGESTION SUCCESS] Record ${record.recordId} stored in MongoDB Atlas for ${targetEmail}`);

    return res.status(201).json({
      success: true,
      message: 'Record successfully ingested into MongoDB Atlas cloud database',
      recordId: record.recordId,
      syncedAt: record.syncedAt
    });
  } catch (error) {
    console.error('[CLOUD INGESTION ERROR]', error.message);
    return next(error);
  }
});

/**
 * Fetch all ingested records for a specific officer / user
 */
router.get('/user/:email', async (req, res, next) => {
  try {
    const email = String(req.params.email).toLowerCase().trim();
    const records = await Record.find({ operatorEmail: email }).sort({ timestampMs: -1 });

    return res.json({
      success: true,
      count: records.length,
      records
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * Public Audit & Chain-of-Custody Verification Endpoint
 */
router.get('/verify/:recordId', async (req, res, next) => {
  try {
    const recordId = String(req.params.recordId).trim();
    const record = await Record.findOne({ recordId });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Record ID not found in cloud database' });
    }

    return res.json({
      success: true,
      message: 'Record verified in MongoDB Atlas cloud ledger',
      record
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
