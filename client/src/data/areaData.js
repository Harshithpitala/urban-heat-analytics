/**
 * Demonstration data for Area-wise temperature and Top Areas rankings.
 * Used in: Temperature by Area Bar Chart & Top Areas Table
 */

export const areaTemperatureData = [
  { area: 'Area A (Central)', temperature: 39.4, threshold: 35.0, riskLevel: 'High' },
  { area: 'Area B (East)', temperature: 37.8, threshold: 35.0, riskLevel: 'High' },
  { area: 'Area C (South)', temperature: 35.2, threshold: 35.0, riskLevel: 'Moderate' },
  { area: 'Area D (West)', temperature: 33.6, threshold: 35.0, riskLevel: 'Moderate' },
  { area: 'Area E (North)', temperature: 31.0, threshold: 35.0, riskLevel: 'Low' },
  { area: 'Area F (Eco Park)', temperature: 28.5, threshold: 35.0, riskLevel: 'Low' },
];

export const topAreasTableData = [
  {
    rank: 1,
    area: 'Central Zone',
    temperature: '39.4°C',
    tempValue: 39.4,
    populationDensity: '16,200 /km²',
    traffic: 'Heavy (88/100)',
    vegetation: 'Low (12% NDVI)',
    status: 'Very High',
    statusType: 'extreme',
  },
  {
    rank: 2,
    area: 'East Industrial Zone',
    temperature: '38.6°C',
    tempValue: 38.6,
    populationDensity: '9,400 /km²',
    traffic: 'Severe (94/100)',
    vegetation: 'Very Low (8% NDVI)',
    status: 'Very High',
    statusType: 'extreme',
  },
  {
    rank: 3,
    area: 'South Commercial Hub',
    temperature: '36.5°C',
    tempValue: 36.5,
    populationDensity: '14,100 /km²',
    traffic: 'High (76/100)',
    vegetation: 'Moderate (21% NDVI)',
    status: 'High',
    statusType: 'high',
  },
  {
    rank: 4,
    area: 'West Residential Corridor',
    temperature: '33.8°C',
    tempValue: 33.8,
    populationDensity: '11,800 /km²',
    traffic: 'Moderate (55/100)',
    vegetation: 'Fair (34% NDVI)',
    status: 'Moderate',
    statusType: 'moderate',
  },
  {
    rank: 5,
    area: 'North Garden Suburb',
    temperature: '29.7°C',
    tempValue: 29.7,
    populationDensity: '6,200 /km²',
    traffic: 'Low (32/100)',
    vegetation: 'Dense (58% NDVI)',
    status: 'Low',
    statusType: 'low',
  },
  {
    rank: 6,
    area: 'Riverfront Green Belt',
    temperature: '27.4°C',
    tempValue: 27.4,
    populationDensity: '2,800 /km²',
    traffic: 'Very Low (14/100)',
    vegetation: 'Abundant (76% NDVI)',
    status: 'Low',
    statusType: 'low',
  },
];
