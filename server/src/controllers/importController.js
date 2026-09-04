const importService = require('../services/importService');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Handles CSV upload and runs full schema, column, and row-level validation.
 */
const uploadAndValidate = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No CSV file uploaded. Please attach a valid .csv file.', 400);
    }

    // Verify extension
    const originalName = req.file.originalname || 'dataset.csv';
    if (!originalName.toLowerCase().endsWith('.csv')) {
      return errorResponse(res, 'Invalid file format. Only .csv files are supported.', 400);
    }

    // Parse custom mapping if passed as JSON string
    let customMapping = {};
    if (req.body.mapping) {
      try {
        customMapping = typeof req.body.mapping === 'string' ? JSON.parse(req.body.mapping) : req.body.mapping;
      } catch (err) {
        // Ignore invalid mapping string
      }
    }

    const report = await importService.parseAndValidateCSV(req.file.buffer, originalName, customMapping);
    return successResponse(res, report, 'CSV validation completed successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

/**
 * Commits staged valid records from an ImportJob into MongoDB.
 */
const commitImport = async (req, res, next) => {
  try {
    const { jobId, duplicateStrategy = 'skip' } = req.body;
    if (!jobId) {
      return errorResponse(res, 'Import Job ID is required to commit import', 400);
    }

    const result = await importService.commitImport(jobId, duplicateStrategy);
    return successResponse(res, result, 'Records imported into database successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves paginated import history.
 */
const getHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const history = await importService.getImportHistory(page, limit);
    return res.status(200).json({
      success: true,
      data: history.jobs,
      pagination: history.pagination,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves details for a specific import job.
 */
const getJobDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const job = await importService.getImportJobById(id);
    if (!job) {
      return errorResponse(res, `Import job ${id} not found`, 404);
    }
    return successResponse(res, job, 'Import job retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Downloads validation error rows as a structured CSV.
 */
const exportErrors = async (req, res, next) => {
  try {
    const { id } = req.params;
    const csvData = await importService.getJobErrorRowsCSV(id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="import_errors_${id}.csv"`);
    return res.status(200).send(csvData);
  } catch (error) {
    next(error);
  }
};

/**
 * Generates and downloads the synthetic CSV template.
 */
const downloadTemplate = (req, res) => {
  const csvTemplate = importService.getCSVTemplateString();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="urban_heat_template.csv"');
  return res.status(200).send(csvTemplate);
};

/**
 * Deletes an import history entry.
 */
const deleteJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await importService.deleteImportJob(id);
    if (!deleted) {
      return errorResponse(res, `Import job ${id} not found`, 404);
    }
    return successResponse(res, { deletedId: id }, 'Import job history entry removed');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadAndValidate,
  commitImport,
  getHistory,
  getJobDetails,
  exportErrors,
  downloadTemplate,
  deleteJob,
};
