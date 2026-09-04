const mongoose = require('mongoose');
const EnvironmentalRecord = require('../../models/EnvironmentalRecord');
const Area = require('../../models/Area');

/**
 * Compares multiple urban areas side-by-side across all environmental and activity dimensions.
 * @param {string[]|string} areaIds - Array or comma-separated list of Area IDs
 */
const compareAreas = async (areaIds) => {
  if (!areaIds) return [];

  let ids = [];
  if (Array.isArray(areaIds)) {
    ids = areaIds;
  } else if (typeof areaIds === 'string') {
    ids = areaIds.split(',').map((id) => id.trim()).filter(Boolean);
  }

  const validObjectIds = ids
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  if (validObjectIds.length === 0) {
    // If names were passed instead of IDs, find them
    const areasFound = await Area.find({
      name: { $in: ids.map((name) => new RegExp(`^${name}$`, 'i')) },
    }).lean();
    if (areasFound.length === 0) return [];
    validObjectIds.push(...areasFound.map((a) => a._id));
  }

  const pipeline = [
    { $match: { area: { $in: validObjectIds } } },
    {
      $group: {
        _id: '$area',
        averageTemperature: { $avg: '$temperature' },
        minimumTemperature: { $min: '$temperature' },
        maximumTemperature: { $max: '$temperature' },
        averageHumidity: { $avg: '$humidity' },
        averageRainfall: { $avg: '$rainfall' },
        averageTraffic: { $avg: '$traffic' },
        averageVegetation: { $avg: '$vegetation' },
        observationCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'areas',
        localField: '_id',
        foreignField: '_id',
        as: 'areaDoc',
      },
    },
    { $unwind: '$areaDoc' },
    {
      $project: {
        _id: 0,
        areaId: '$_id',
        name: '$areaDoc.name',
        city: '$areaDoc.city',
        zone: '$areaDoc.zone',
        landUse: '$areaDoc.landUse',
        populationDensity: '$areaDoc.populationDensity',
        buildingDensity: '$areaDoc.buildingDensity',
        averageTemperature: { $round: ['$averageTemperature', 1] },
        minimumTemperature: { $round: ['$minimumTemperature', 1] },
        maximumTemperature: { $round: ['$maximumTemperature', 1] },
        averageHumidity: { $round: ['$averageHumidity', 0] },
        averageRainfall: { $round: ['$averageRainfall', 1] },
        averageTraffic: { $round: ['$averageTraffic', 0] },
        averageVegetation: { $round: ['$averageVegetation', 0] },
        observationCount: 1,
      },
    },
    { $sort: { averageTemperature: -1 } },
  ];

  return await EnvironmentalRecord.aggregate(pipeline);
};

module.exports = {
  compareAreas,
};
