const environmentalDataService = require('../services/environmentalDataService');
const { successResponse, errorResponse } = require('../utils/response');
const { validateEnvironmentalMetrics, validateCoordinates } = require('../utils/validators');

const getRecords = async (req, res, next) => {
  try {
    const result = await environmentalDataService.getRecords(req.query);
    return res.status(200).json({
      success: true,
      data: result.records,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

const getRecordById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse(res, 'Invalid Record ID format', 400);
    }

    const record = await environmentalDataService.getRecordById(id);
    if (!record) {
      return errorResponse(res, `Environmental record ${id} not found`, 404);
    }

    return successResponse(res, record, 'Record retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createRecord = async (req, res, next) => {
  try {
    const { area, date, temperature, humidity, rainfall } = req.body;

    if (!area || !date) {
      return errorResponse(res, 'Area reference and observation date are required', 400);
    }

    // Bounds validation
    const validation = validateEnvironmentalMetrics(req.body);
    if (!validation.valid) {
      return errorResponse(res, 'Data validation failed', 422, validation.errors);
    }

    if (req.body.latitude !== undefined && req.body.longitude !== undefined) {
      const coordCheck = validateCoordinates(Number(req.body.latitude), Number(req.body.longitude));
      if (!coordCheck.valid) {
        return errorResponse(res, coordCheck.error, 400);
      }
    }

    const created = await environmentalDataService.createRecord(req.body);
    return successResponse(res, created, 'Observation record created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse(res, 'Invalid Record ID format', 400);
    }

    const validation = validateEnvironmentalMetrics(req.body);
    if (!validation.valid) {
      return errorResponse(res, 'Data validation failed', 422, validation.errors);
    }

    const updated = await environmentalDataService.updateRecord(id, req.body);
    if (!updated) {
      return errorResponse(res, `Environmental record ${id} not found`, 404);
    }

    return successResponse(res, updated, 'Record updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse(res, 'Invalid Record ID format', 400);
    }

    const deleted = await environmentalDataService.deleteRecord(id);
    if (!deleted) {
      return errorResponse(res, `Environmental record ${id} not found`, 404);
    }

    return successResponse(res, { deletedId: id }, 'Record deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getDataQuality = async (req, res, next) => {
  try {
    const qualityMetrics = await environmentalDataService.getDataQualityMetrics();
    return successResponse(res, qualityMetrics, 'Data quality metrics calculated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
  getDataQuality,
};
