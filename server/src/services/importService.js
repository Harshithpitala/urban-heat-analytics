const Area = require('../models/Area');
const EnvironmentalRecord = require('../models/EnvironmentalRecord');
const ImportJob = require('../models/ImportJob');
const { LAND_USE_TYPES } = require('../constants/landUse');
const { isValidDate } = require('../utils/timeUtils');

const SUPPORTED_COLUMNS = [
  'areaName',
  'city',
  'zone',
  'latitude',
  'longitude',
  'date',
  'temperature',
  'humidity',
  'rainfall',
  'traffic',
  'populationDensity',
  'buildingDensity',
  'vegetation',
  'landUse',
];

const REQUIRED_COLUMNS = ['areaName', 'date', 'temperature', 'humidity'];

// Common alias map for default automatic suggestion
const DEFAULT_COLUMN_ALIASES = {
  temp: 'temperature',
  temp_c: 'temperature',
  hum: 'humidity',
  humidity_pct: 'humidity',
  rain: 'rainfall',
  precip: 'rainfall',
  precipitation: 'rainfall',
  traffic_index: 'traffic',
  traffic_count: 'traffic',
  pop_density: 'populationDensity',
  bldg_density: 'buildingDensity',
  building_density: 'buildingDensity',
  green_cover: 'vegetation',
  ndvi: 'vegetation',
  land_use: 'landUse',
  landuse: 'landUse',
  area: 'areaName',
  zone_name: 'zone',
  lat: 'latitude',
  lng: 'longitude',
  lon: 'longitude',
};

/**
 * Robust CSV Line Parser handling quotes, commas, and escaped characters.
 */
const parseCSVText = (csvString) => {
  const lines = csvString.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (text) => {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        if (inQuotes && text[i + 1] === '"') {
          current += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  const rawHeaders = parseLine(lines[0]);
  const headers = rawHeaders.map((h) => h.replace(/^["']|["']$/g, '').trim());

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const rawValues = parseLine(lines[i]);
    const rowObj = {};
    headers.forEach((header, idx) => {
      rowObj[header] = rawValues[idx] !== undefined ? rawValues[idx].replace(/^["']|["']$/g, '').trim() : '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
};

/**
 * Normalizes Land Use input to title case matching the enum.
 */
const normalizeLandUse = (raw) => {
  if (!raw) return 'Mixed Use';
  const clean = raw.trim().toLowerCase();
  const match = LAND_USE_TYPES.find((type) => type.toLowerCase() === clean);
  return match || null;
};

/**
 * Inspects headers and returns column validation summary.
 */
const inspectColumns = (rawHeaders, customMapping = {}) => {
  const effectiveHeaders = {};
  const duplicateHeaders = [];
  const seen = new Set();

  rawHeaders.forEach((raw) => {
    if (seen.has(raw.toLowerCase())) {
      duplicateHeaders.push(raw);
    }
    seen.add(raw.toLowerCase());

    // Check custom mapping first, then default aliases, or direct match
    if (customMapping[raw] && SUPPORTED_COLUMNS.includes(customMapping[raw])) {
      effectiveHeaders[raw] = customMapping[raw];
    } else if (SUPPORTED_COLUMNS.includes(raw)) {
      effectiveHeaders[raw] = raw;
    } else if (DEFAULT_COLUMN_ALIASES[raw.toLowerCase()]) {
      effectiveHeaders[raw] = DEFAULT_COLUMN_ALIASES[raw.toLowerCase()];
    } else {
      effectiveHeaders[raw] = null; // Unrecognized
    }
  });

  const matchedSystemColumns = Object.values(effectiveHeaders).filter(Boolean);
  const missingRequired = REQUIRED_COLUMNS.filter((req) => !matchedSystemColumns.includes(req));
  const unrecognizedColumns = rawHeaders.filter((h) => !effectiveHeaders[h]);

  return {
    rawHeaders,
    effectiveHeaders,
    duplicateHeaders,
    missingRequired,
    unrecognizedColumns,
    isValid: missingRequired.length === 0 && duplicateHeaders.length === 0,
  };
};

/**
 * Parses and validates an uploaded CSV file buffer.
 */
const parseAndValidateCSV = async (fileBuffer, filename, customMapping = {}) => {
  const csvContent = fileBuffer.toString('utf-8');
  const { headers: rawHeaders, rows: rawRows } = parseCSVText(csvContent);

  if (rawRows.length === 0) {
    throw new Error('Uploaded CSV file is empty or contains no valid observation rows');
  }

  const colInspection = inspectColumns(rawHeaders, customMapping);

  if (colInspection.duplicateHeaders.length > 0) {
    throw new Error(`CSV contains duplicate header names: ${colInspection.duplicateHeaders.join(', ')}`);
  }

  if (colInspection.missingRequired.length > 0) {
    throw new Error(
      `CSV is missing required columns: ${colInspection.missingRequired.join(', ')}. Supported columns: ${SUPPORTED_COLUMNS.join(', ')}`
    );
  }

  // Pre-load existing Areas into memory for rapid cross-referencing
  const existingAreas = await Area.find({}).lean();
  const areaLookup = new Map();
  existingAreas.forEach((a) => {
    const key = `${(a.city || 'metro city').toLowerCase()}_${a.name.toLowerCase()}`;
    areaLookup.set(key, a);
  });

  // Query existing database records to detect existing observations
  const existingObservations = await EnvironmentalRecord.find({})
    .select('area date')
    .lean();
  const existingObservationKeys = new Set(
    existingObservations.map((r) => `${r.area.toString()}_${new Date(r.date).toISOString()}`)
  );

  const seenInFile = new Set();
  const validationErrors = [];
  const stagedRecords = [];
  const previewRows = [];

  let validCount = 0;
  let warningCount = 0;
  let invalidCount = 0;
  let duplicateCount = 0;

  // Field-level error counters
  const fieldErrorSummary = {
    areaName: 0,
    date: 0,
    temperature: 0,
    humidity: 0,
    rainfall: 0,
    traffic: 0,
    coordinates: 0,
    landUse: 0,
  };

  for (let idx = 0; idx < rawRows.length; idx++) {
    const rawRow = rawRows[idx];
    const rowNumber = idx + 2; // +1 for 0-index, +1 for header line
    const rowErrors = [];
    const rowWarnings = [];

    // Map raw headers to normalized system keys
    const row = {};
    rawHeaders.forEach((h) => {
      const targetKey = colInspection.effectiveHeaders[h];
      if (targetKey) {
        row[targetKey] = rawRow[h];
      }
    });

    // 1. Area Validation
    const areaName = (row.areaName || '').trim();
    const city = (row.city || 'Metro City').trim();
    if (!areaName) {
      rowErrors.push({ field: 'areaName', reason: 'Area name must not be empty' });
      fieldErrorSummary.areaName++;
    }

    // 2. Date Validation
    const dateStr = (row.date || '').trim();
    let parsedDate = null;
    if (!dateStr || !isValidDate(dateStr)) {
      rowErrors.push({ field: 'date', reason: `Invalid date format: "${dateStr}"` });
      fieldErrorSummary.date++;
    } else {
      parsedDate = new Date(dateStr);
    }

    // 3. Temperature Validation
    const tempRaw = row.temperature;
    let parsedTemp = null;
    if (tempRaw === undefined || tempRaw === '' || isNaN(Number(tempRaw))) {
      rowErrors.push({ field: 'temperature', reason: 'Temperature must be a valid numeric value' });
      fieldErrorSummary.temperature++;
    } else {
      parsedTemp = Number(Number(tempRaw).toFixed(1));
      if (parsedTemp < -10 || parsedTemp > 65) {
        rowErrors.push({ field: 'temperature', reason: `Temperature ${parsedTemp}°C is outside valid range (-10°C to 65°C)` });
        fieldErrorSummary.temperature++;
      } else if (parsedTemp >= 47) {
        rowWarnings.push({ field: 'temperature', reason: `Unusually extreme heat observation: ${parsedTemp}°C` });
      }
    }

    // 4. Humidity Validation
    const humRaw = row.humidity;
    let parsedHumidity = null;
    if (humRaw === undefined || humRaw === '' || isNaN(Number(humRaw))) {
      rowErrors.push({ field: 'humidity', reason: 'Humidity must be a valid numeric value' });
      fieldErrorSummary.humidity++;
    } else {
      parsedHumidity = Number(Number(humRaw).toFixed(0));
      if (parsedHumidity < 0 || parsedHumidity > 100) {
        rowErrors.push({ field: 'humidity', reason: `Humidity ${parsedHumidity}% is outside valid bounds (0-100%)` });
        fieldErrorSummary.humidity++;
      }
    }

    // 5. Rainfall Validation
    let parsedRainfall = 0;
    if (row.rainfall !== undefined && row.rainfall !== '') {
      if (isNaN(Number(row.rainfall)) || Number(row.rainfall) < 0) {
        rowErrors.push({ field: 'rainfall', reason: 'Rainfall must be a non-negative number' });
        fieldErrorSummary.rainfall++;
      } else {
        parsedRainfall = Number(Number(row.rainfall).toFixed(1));
      }
    }

    // 6. Traffic Validation
    let parsedTraffic = 50;
    if (row.traffic !== undefined && row.traffic !== '') {
      if (isNaN(Number(row.traffic)) || Number(row.traffic) < 0 || Number(row.traffic) > 100) {
        rowErrors.push({ field: 'traffic', reason: 'Traffic index must be between 0 and 100' });
        fieldErrorSummary.traffic++;
      } else {
        parsedTraffic = Math.round(Number(row.traffic));
        if (parsedTraffic > 95) {
          rowWarnings.push({ field: 'traffic', reason: 'Severe vehicular traffic saturation' });
        }
      }
    }

    // 7. Coordinates Validation (optional per row if area exists)
    let parsedLat = row.latitude !== undefined && row.latitude !== '' ? Number(row.latitude) : undefined;
    let parsedLng = row.longitude !== undefined && row.longitude !== '' ? Number(row.longitude) : undefined;
    if (parsedLat !== undefined && (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90)) {
      rowErrors.push({ field: 'latitude', reason: 'Latitude must be between -90 and 90' });
      fieldErrorSummary.coordinates++;
    }
    if (parsedLng !== undefined && (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180)) {
      rowErrors.push({ field: 'longitude', reason: 'Longitude must be between -180 and 180' });
      fieldErrorSummary.coordinates++;
    }

    // 8. Land Use Validation
    let parsedLandUse = 'Mixed Use';
    if (row.landUse) {
      const normalized = normalizeLandUse(row.landUse);
      if (!normalized) {
        rowErrors.push({ field: 'landUse', reason: `Unknown land-use category "${row.landUse}". Supported: ${LAND_USE_TYPES.join(', ')}` });
        fieldErrorSummary.landUse++;
      } else {
        parsedLandUse = normalized;
      }
    }

    // 9. Duplicate Detection (in-file & database check)
    let isDuplicate = false;
    if (areaName && parsedDate) {
      const fileKey = `${city.toLowerCase()}_${areaName.toLowerCase()}_${parsedDate.toISOString()}`;
      if (seenInFile.has(fileKey)) {
        isDuplicate = true;
        duplicateCount++;
        rowWarnings.push({ field: 'duplicate', reason: 'Duplicate observation in uploaded file' });
      } else {
        seenInFile.add(fileKey);
      }

      // Check against MongoDB
      const areaLookupKey = `${city.toLowerCase()}_${areaName.toLowerCase()}`;
      const existingAreaDoc = areaLookup.get(areaLookupKey);
      if (existingAreaDoc) {
        const dbKey = `${existingAreaDoc._id.toString()}_${parsedDate.toISOString()}`;
        if (existingObservationKeys.has(dbKey)) {
          isDuplicate = true;
          duplicateCount++;
          rowWarnings.push({ field: 'duplicate', reason: 'Duplicate observation already exists in MongoDB database' });
        }
      }
    }

    // Check if Area exists or can be auto-created
    if (areaName && rowErrors.length === 0) {
      const areaKey = `${city.toLowerCase()}_${areaName.toLowerCase()}`;
      const hasArea = areaLookup.has(areaKey);
      if (!hasArea) {
        if (parsedLat === undefined || parsedLng === undefined) {
          rowErrors.push({
            field: 'areaName',
            reason: `Area "${areaName}" does not exist in database and missing valid latitude/longitude to auto-create`,
          });
          fieldErrorSummary.areaName++;
        }
      }
    }

    // Determine row quality status
    let rowStatus = 'Valid';
    if (rowErrors.length > 0) {
      rowStatus = 'Error';
      invalidCount++;
      rowErrors.forEach((err) => {
        validationErrors.push({
          rowNumber,
          areaName,
          date: dateStr,
          field: err.field,
          value: row[err.field] || '',
          reason: err.reason,
          severity: 'Error',
          rawRow,
        });
      });
    } else if (rowWarnings.length > 0 || isDuplicate) {
      rowStatus = 'Warning';
      warningCount++;
      rowWarnings.forEach((warn) => {
        validationErrors.push({
          rowNumber,
          areaName,
          date: dateStr,
          field: warn.field,
          value: row[warn.field] || '',
          reason: warn.reason,
          severity: 'Warning',
          rawRow,
        });
      });
    } else {
      validCount++;
    }

    // Stage valid/warning rows for potential commit
    if (rowStatus !== 'Error') {
      stagedRecords.push({
        areaName,
        city,
        zone: row.zone || 'General Zone',
        latitude: parsedLat,
        longitude: parsedLng,
        date: parsedDate,
        temperature: parsedTemp,
        humidity: parsedHumidity,
        rainfall: parsedRainfall,
        traffic: parsedTraffic,
        populationDensity: row.populationDensity ? Math.max(0, Number(row.populationDensity)) : 5000,
        buildingDensity: row.buildingDensity ? Math.min(100, Math.max(0, Number(row.buildingDensity))) : 50,
        vegetation: row.vegetation ? Math.min(100, Math.max(0, Number(row.vegetation))) : 30,
        landUse: parsedLandUse,
        isDuplicate,
        hasWarning: rowWarnings.length > 0,
      });
    }

    // Preview row (up to first 50 rows)
    if (idx < 50) {
      previewRows.push({
        rowNumber,
        area: areaName || 'Missing',
        city,
        date: dateStr,
        temperature: tempRaw !== undefined ? `${tempRaw}°C` : '-',
        humidity: humRaw !== undefined ? `${humRaw}%` : '-',
        rainfall: row.rainfall ? `${row.rainfall} mm` : '0 mm',
        traffic: row.traffic ? `${row.traffic}/100` : '-',
        populationDensity: row.populationDensity || '-',
        buildingDensity: row.buildingDensity ? `${row.buildingDensity}%` : '-',
        vegetation: row.vegetation ? `${row.vegetation}%` : '-',
        landUse: row.landUse || 'Mixed Use',
        status: rowStatus,
        issues: [...rowErrors, ...rowWarnings].map((i) => i.reason),
      });
    }
  }

  // Create initial ImportJob record in MongoDB
  const importJob = new ImportJob({
    filename,
    uploadedAt: new Date(),
    status: invalidCount === rawRows.length ? 'Failed' : 'Validated',
    totalRows: rawRows.length,
    validRows: validCount,
    warningRows: warningCount,
    invalidRows: invalidCount,
    duplicateRows: duplicateCount,
    errorCount: validationErrors.filter((e) => e.severity === 'Error').length,
    errors: validationErrors.slice(0, 500), // Cap for memory/storage safety
    stagedRecords,
  });

  await importJob.save();

  return {
    jobId: importJob._id,
    filename,
    totalRows: rawRows.length,
    validRows: validCount,
    warningRows: warningCount,
    invalidRows: invalidCount,
    duplicateRows: duplicateCount,
    status: importJob.status,
    columns: colInspection,
    fieldErrorSummary,
    preview: previewRows,
    qualitySummary: {
      completenessPercent: Number((((rawRows.length - invalidCount) / rawRows.length) * 100).toFixed(1)),
      canImport: stagedRecords.length > 0,
      totalStaged: stagedRecords.length,
    },
  };
};

/**
 * Commits staged valid records from an ImportJob into MongoDB.
 * @param {string} jobId
 * @param {'skip'|'import_all'} duplicateStrategy
 */
const commitImport = async (jobId, duplicateStrategy = 'skip') => {
  const job = await ImportJob.findById(jobId);
  if (!job) {
    throw new Error(`Import job ${jobId} not found`);
  }

  if (job.status === 'Completed') {
    throw new Error('This import job has already been committed');
  }

  if (!job.stagedRecords || job.stagedRecords.length === 0) {
    throw new Error('No valid records found in this job to import');
  }

  job.status = 'Importing';
  await job.save();

  try {
    // 1. Resolve Areas: pre-load existing Areas into memory
    const existingAreas = await Area.find({}).lean();
    const areaMap = new Map();
    existingAreas.forEach((a) => {
      const key = `${(a.city || 'metro city').toLowerCase()}_${a.name.toLowerCase()}`;
      areaMap.set(key, a);
    });

    // Determine records to import based on duplicate strategy
    let candidates = job.stagedRecords;
    if (duplicateStrategy === 'skip') {
      candidates = job.stagedRecords.filter((r) => !r.isDuplicate);
    }

    const skippedCount = job.stagedRecords.length - candidates.length + job.invalidRows;
    const recordsToInsert = [];

    // 2. Iterate candidates, ensuring Area exists or is auto-created
    for (const record of candidates) {
      const areaKey = `${(record.city || 'metro city').toLowerCase()}_${record.areaName.toLowerCase()}`;
      let areaDoc = areaMap.get(areaKey);

      if (!areaDoc) {
        // Auto-create Area document
        const newArea = new Area({
          name: record.areaName,
          city: record.city || 'Metro City',
          zone: record.zone || 'General Zone',
          latitude: record.latitude || 28.6139,
          longitude: record.longitude || 77.2090,
          landUse: record.landUse || 'Mixed Use',
          populationDensity: record.populationDensity || 5000,
          buildingDensity: record.buildingDensity || 50,
          vegetation: record.vegetation || 30,
          description: `Auto-registered via CSV import (${job.filename})`,
        });
        const savedArea = await newArea.save();
        areaDoc = savedArea.toObject();
        areaMap.set(areaKey, areaDoc);
      }

      recordsToInsert.push({
        area: areaDoc._id,
        date: record.date,
        temperature: record.temperature,
        humidity: record.humidity,
        rainfall: record.rainfall,
        vegetation: record.vegetation,
        traffic: record.traffic,
        populationDensity: record.populationDensity || areaDoc.populationDensity,
        buildingDensity: record.buildingDensity || areaDoc.buildingDensity,
        landUse: record.landUse || areaDoc.landUse,
        city: record.city || areaDoc.city,
        latitude: record.latitude || areaDoc.latitude,
        longitude: record.longitude || areaDoc.longitude,
      });
    }

    // 3. Batch bulk insert into MongoDB (chunks of 500)
    const BATCH_SIZE = 500;
    let insertedCount = 0;

    for (let i = 0; i < recordsToInsert.length; i += BATCH_SIZE) {
      const chunk = recordsToInsert.slice(i, i + BATCH_SIZE);
      await EnvironmentalRecord.insertMany(chunk, { ordered: false });
      insertedCount += chunk.length;
    }

    // 4. Update ImportJob
    job.status = 'Completed';
    job.importedRows = insertedCount;
    job.skippedRows = skippedCount;
    job.stagedRecords = []; // Clear staging memory
    job.completedAt = new Date();
    await job.save();

    return {
      success: true,
      jobId: job._id,
      filename: job.filename,
      importedRows: insertedCount,
      skippedRows: skippedCount,
      totalRows: job.totalRows,
      status: 'Completed',
      completedAt: job.completedAt,
    };
  } catch (error) {
    job.status = 'Failed';
    await job.save();
    throw error;
  }
};

/**
 * Returns past import jobs with pagination.
 */
const getImportHistory = async (page = 1, limit = 20) => {
  const parsedPage = Math.max(1, parseInt(page, 10));
  const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (parsedPage - 1) * parsedLimit;

  const total = await ImportJob.countDocuments();
  const jobs = await ImportJob.find({})
    .select('-stagedRecords')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parsedLimit)
    .lean();

  return {
    jobs,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      pages: Math.ceil(total / parsedLimit) || 1,
    },
  };
};

/**
 * Returns details of a specific import job.
 */
const getImportJobById = async (id) => {
  return await ImportJob.findById(id).select('-stagedRecords').lean();
};

/**
 * Generates an error CSV string for an import job for user download.
 */
const getJobErrorRowsCSV = async (id) => {
  const job = await ImportJob.findById(id).lean();
  if (!job) {
    throw new Error(`Import job ${id} not found`);
  }

  const errors = job.errors || [];
  if (errors.length === 0) {
    return 'rowNumber,areaName,date,field,reason\n';
  }

  const headers = ['rowNumber', 'areaName', 'date', 'field', 'reason', 'severity'];
  const lines = [headers.join(',')];

  errors.forEach((err) => {
    const row = [
      err.rowNumber || '',
      `"${(err.areaName || '').replace(/"/g, '""')}"`,
      `"${(err.date || '').replace(/"/g, '""')}"`,
      `"${(err.field || '').replace(/"/g, '""')}"`,
      `"${(err.reason || '').replace(/"/g, '""')}"`,
      err.severity || 'Error',
    ];
    lines.push(row.join(','));
  });

  return lines.join('\n');
};

/**
 * Generates the synthetic CSV template.
 */
const getCSVTemplateString = () => {
  return [
    SUPPORTED_COLUMNS.join(','),
    'Central Financial District,Metro City,Central Zone,28.6139,77.2090,2026-08-01T14:00:00Z,39.5,48,0,88,16500,88,12,Commercial',
    'North Garden Hills,Metro City,North Zone,28.7041,77.1025,2026-08-01T14:00:00Z,31.2,64,0,35,6400,42,56,Residential',
    'Riverside Eco Reserve,Metro City,Green Zone,28.5800,77.3000,2026-08-01T14:00:00Z,27.6,72,0,14,1800,8,84,Green Space',
  ].join('\n');
};

/**
 * Deletes an import job entry.
 */
const deleteImportJob = async (id) => {
  return await ImportJob.findByIdAndDelete(id);
};

module.exports = {
  SUPPORTED_COLUMNS,
  REQUIRED_COLUMNS,
  parseCSVText,
  inspectColumns,
  parseAndValidateCSV,
  commitImport,
  getImportHistory,
  getImportJobById,
  getJobErrorRowsCSV,
  getCSVTemplateString,
  deleteImportJob,
};
