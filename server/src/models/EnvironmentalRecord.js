const mongoose = require('mongoose');
const { LAND_USE_TYPES } = require('../constants/landUse');

/**
 * EnvironmentalRecord Model
 * Time-series observation tracking environmental and human activity variables for an urban area.
 */
const environmentalRecordSchema = new mongoose.Schema(
  {
    area: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Area',
      required: [true, 'Area reference is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Observation date is required'],
      index: true,
    },
    // Time-varying environmental readings
    temperature: {
      type: Number,
      required: [true, 'Temperature is required'],
      min: [-10, 'Temperature cannot be below -10°C'],
      max: [65, 'Temperature cannot exceed 65°C'],
    },
    humidity: {
      type: Number,
      required: [true, 'Humidity is required'],
      min: [0, 'Humidity cannot be below 0%'],
      max: [100, 'Humidity cannot exceed 100%'],
    },
    rainfall: {
      type: Number,
      required: [true, 'Rainfall is required'],
      min: [0, 'Rainfall cannot be negative'],
      default: 0,
    },
    // Dynamic or seasonal vegetation index
    vegetation: {
      type: Number,
      min: [0, 'Vegetation cover cannot be below 0%'],
      max: [100, 'Vegetation cover cannot exceed 100%'],
      default: 30,
    },
    // Human activity & mobility intensity (0-100 index)
    traffic: {
      type: Number,
      min: [0, 'Traffic index cannot be negative'],
      max: [100, 'Traffic index cannot exceed 100'],
      default: 50,
    },
    // Contextual snapshots (for fast time-series aggregation without multi-join overhead)
    populationDensity: {
      type: Number,
      min: [0, 'Population density cannot be negative'],
    },
    buildingDensity: {
      type: Number,
      min: [0, 'Building density cannot be below 0%'],
      max: [100, 'Building density cannot exceed 100%'],
    },
    landUse: {
      type: String,
      enum: {
        values: LAND_USE_TYPES,
        message: '{VALUE} is not a valid land-use type',
      },
      index: true,
    },
    city: {
      type: String,
      trim: true,
      default: 'Metro City',
    },
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be >= -90'],
      max: [90, 'Latitude must be <= 90'],
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be >= -180'],
      max: [180, 'Longitude must be <= 180'],
    },
  },
  {
    timestamps: true,
  }
);

// Targeted compound indexes for high-frequency queries
environmentalRecordSchema.index({ area: 1, date: -1 });
environmentalRecordSchema.index({ city: 1, date: -1 });
environmentalRecordSchema.index({ date: -1 });
environmentalRecordSchema.index({ landUse: 1, temperature: -1 });

module.exports = mongoose.model('EnvironmentalRecord', environmentalRecordSchema);
