const mongoose = require('mongoose');

/**
 * ImportJob Schema
 * Tracks the lifecycle, audit metadata, validation results, and execution statistics of CSV import operations.
 */
const importJobSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
      trim: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Uploaded', 'Validating', 'Validated', 'Importing', 'Completed', 'Failed', 'Cancelled'],
      default: 'Uploaded',
      index: true,
    },
    totalRows: {
      type: Number,
      default: 0,
    },
    validRows: {
      type: Number,
      default: 0,
    },
    warningRows: {
      type: Number,
      default: 0,
    },
    invalidRows: {
      type: Number,
      default: 0,
    },
    duplicateRows: {
      type: Number,
      default: 0,
    },
    importedRows: {
      type: Number,
      default: 0,
    },
    skippedRows: {
      type: Number,
      default: 0,
    },
    errorCount: {
      type: Number,
      default: 0,
    },
    // Detailed validation errors for row-level feedback and error CSV export
    errors: [
      {
        rowNumber: Number,
        areaName: String,
        date: String,
        field: String,
        value: mongoose.Schema.Types.Mixed,
        reason: String,
        severity: {
          type: String,
          enum: ['Warning', 'Error'],
          default: 'Error',
        },
        rawRow: mongoose.Schema.Types.Mixed,
      },
    ],
    // Staging array of parsed & validated records ready for user commit
    stagedRecords: [
      {
        areaName: String,
        city: String,
        zone: String,
        latitude: Number,
        longitude: Number,
        date: Date,
        temperature: Number,
        humidity: Number,
        rainfall: Number,
        traffic: Number,
        populationDensity: Number,
        buildingDensity: Number,
        vegetation: Number,
        landUse: String,
        isDuplicate: Boolean,
        hasWarning: Boolean,
      },
    ],
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true,
  }
);

// Sort by recent imports
importJobSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ImportJob', importJobSchema);
