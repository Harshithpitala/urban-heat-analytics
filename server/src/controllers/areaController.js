const areaService = require('../services/areaService');
const { successResponse, errorResponse } = require('../utils/response');
const { validateCoordinates } = require('../utils/validators');

const getAreas = async (req, res, next) => {
  try {
    const result = await areaService.getAreas(req.query);
    return res.status(200).json({
      success: true,
      data: result.areas,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

const getAreaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse(res, 'Invalid Area ID format', 400);
    }

    const area = await areaService.getAreaById(id);
    if (!area) {
      return errorResponse(res, `Area with ID ${id} not found`, 404);
    }

    return successResponse(res, area, 'Area retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createArea = async (req, res, next) => {
  try {
    const { name, city, latitude, longitude } = req.body;
    if (!name || !city) {
      return errorResponse(res, 'Area name and city are required', 400);
    }

    if (latitude !== undefined && longitude !== undefined) {
      const coordCheck = validateCoordinates(Number(latitude), Number(longitude));
      if (!coordCheck.valid) {
        return errorResponse(res, coordCheck.error, 400);
      }
    }

    const created = await areaService.createArea(req.body);
    return successResponse(res, created, 'Area created successfully', 201);
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, 'An area with this name already exists in this city', 409);
    }
    next(error);
  }
};

const updateArea = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse(res, 'Invalid Area ID format', 400);
    }

    if (req.body.latitude !== undefined && req.body.longitude !== undefined) {
      const coordCheck = validateCoordinates(Number(req.body.latitude), Number(req.body.longitude));
      if (!coordCheck.valid) {
        return errorResponse(res, coordCheck.error, 400);
      }
    }

    const updated = await areaService.updateArea(id, req.body);
    if (!updated) {
      return errorResponse(res, `Area with ID ${id} not found`, 404);
    }

    return successResponse(res, updated, 'Area updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteArea = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse(res, 'Invalid Area ID format', 400);
    }

    const deleted = await areaService.deleteArea(id);
    if (!deleted) {
      return errorResponse(res, `Area with ID ${id} not found`, 404);
    }

    return successResponse(res, { deletedId: id }, 'Area and associated observations deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAreas,
  getAreaById,
  createArea,
  updateArea,
  deleteArea,
};
