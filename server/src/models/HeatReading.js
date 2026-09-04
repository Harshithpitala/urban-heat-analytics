const mongoose = require('mongoose');

/**
 * HeatReading Schema
 * Placeholder architecture for Phase 2 database integration.
 */
const heatReadingSchema = new mongoose.Schema(
  {
    areaName: {
      type: String,
      required: true,
      trim: true,
    },
    zoneCode: {
      type: String,
      required: true,
      uppercase: true,
    },
    temperature: {
      type: Number,
      required: true,
    },
    humidity: {
      type: Number,
      required: true,
    },
    rainfall: {
      type: Number,
      default: 0,
    },
    vegetationIndex: {
      type: Number,
      min: 0,
      max: 1,
    },
    trafficDensity: {
      type: Number,
      min: 0,
      max: 100,
    },
    populationDensity: {
      type: Number,
    },
    landUseType: {
      type: String,
      enum: ['Residential', 'Commercial', 'Industrial', 'Green Space', 'Mixed'],
      default: 'Mixed',
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('HeatReading', heatReadingSchema);
