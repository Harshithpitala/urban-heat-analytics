const mongoose = require('mongoose');
const { LAND_USE_TYPES } = require('../constants/landUse');

/**
 * Area Model
 * Represents a geographical urban sector or municipal district with static baseline attributes.
 */
const areaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Area name is required'],
      trim: true,
      minlength: [2, 'Area name must be at least 2 characters'],
      maxlength: [100, 'Area name cannot exceed 100 characters'],
    },
    city: {
      type: String,
      required: [true, 'City name is required'],
      trim: true,
      default: 'Metro City',
    },
    zone: {
      type: String,
      trim: true,
      default: 'General Zone',
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude coordinate is required'],
      min: [-90, 'Latitude cannot be less than -90'],
      max: [90, 'Latitude cannot be greater than 90'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude coordinate is required'],
      min: [-180, 'Longitude cannot be less than -180'],
      max: [180, 'Longitude cannot be greater than 180'],
    },
    landUse: {
      type: String,
      required: [true, 'Land use classification is required'],
      enum: {
        values: LAND_USE_TYPES,
        message: '{VALUE} is not a supported land-use type',
      },
      default: 'Mixed Use',
    },
    populationDensity: {
      type: Number,
      min: [0, 'Population density cannot be negative'],
      default: 5000,
    },
    buildingDensity: {
      type: Number,
      min: [0, 'Building density cannot be less than 0%'],
      max: [100, 'Building density cannot exceed 100%'],
      default: 50,
    },
    vegetation: {
      type: Number,
      min: [0, 'Vegetation cover cannot be less than 0%'],
      max: [100, 'Vegetation cover cannot exceed 100%'],
      default: 30,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Compound unique index ensuring no duplicate area names within the same city
areaSchema.index({ city: 1, name: 1 }, { unique: true });
areaSchema.index({ zone: 1 });
areaSchema.index({ landUse: 1 });

module.exports = mongoose.model('Area', areaSchema);
