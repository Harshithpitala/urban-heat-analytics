/**
 * Environmental and Spatial validation helpers.
 */

const validateCoordinates = (latitude, longitude) => {
  if (typeof latitude !== 'number' || isNaN(latitude) || latitude < -90 || latitude > 90) {
    return { valid: false, error: 'Latitude must be a valid number between -90 and 90' };
  }
  if (typeof longitude !== 'number' || isNaN(longitude) || longitude < -180 || longitude > 180) {
    return { valid: false, error: 'Longitude must be a valid number between -180 and 180' };
  }
  return { valid: true };
};

const validateEnvironmentalMetrics = ({
  temperature,
  humidity,
  rainfall,
  vegetation,
  traffic,
  populationDensity,
  buildingDensity,
}) => {
  const errors = [];

  if (temperature !== undefined) {
    if (typeof temperature !== 'number' || isNaN(temperature)) {
      errors.push('Temperature must be a valid number');
    } else if (temperature < -10 || temperature > 65) {
      errors.push('Temperature must be between -10°C and 65°C');
    }
  }

  if (humidity !== undefined) {
    if (typeof humidity !== 'number' || isNaN(humidity) || humidity < 0 || humidity > 100) {
      errors.push('Humidity must be a number between 0% and 100%');
    }
  }

  if (rainfall !== undefined) {
    if (typeof rainfall !== 'number' || isNaN(rainfall) || rainfall < 0) {
      errors.push('Rainfall must be a non-negative number (>= 0 mm)');
    }
  }

  if (vegetation !== undefined) {
    if (typeof vegetation !== 'number' || isNaN(vegetation) || vegetation < 0 || vegetation > 100) {
      errors.push('Vegetation must be a percentage between 0 and 100%');
    }
  }

  if (traffic !== undefined) {
    if (typeof traffic !== 'number' || isNaN(traffic) || traffic < 0 || traffic > 100) {
      errors.push('Traffic index must be a number between 0 and 100');
    }
  }

  if (populationDensity !== undefined) {
    if (typeof populationDensity !== 'number' || isNaN(populationDensity) || populationDensity < 0) {
      errors.push('Population density must be non-negative');
    }
  }

  if (buildingDensity !== undefined) {
    if (typeof buildingDensity !== 'number' || isNaN(buildingDensity) || buildingDensity < 0 || buildingDensity > 100) {
      errors.push('Building density must be a percentage between 0 and 100%');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateCoordinates,
  validateEnvironmentalMetrics,
};
