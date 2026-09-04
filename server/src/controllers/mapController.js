const geoService = require('../analytics/geospatial/geoService');

/**
 * Controller for Geospatial Intelligence Map APIs (Phase 7)
 */

exports.getMapAreas = async (req, res, next) => {
  try {
    const data = await geoService.getGeospatialAreas(req.query);
    res.status(200).json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

exports.getMapSummary = async (req, res, next) => {
  try {
    const data = await geoService.getGeospatialSummary(req.query);
    res.status(200).json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

exports.getMapGeoJson = async (req, res, next) => {
  try {
    const data = await geoService.getGeospatialGeoJson(req.query);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};
