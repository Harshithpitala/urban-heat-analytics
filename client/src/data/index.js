export * from './temperatureData';
export * from './areaData';
export * from './landUseData';
export * from './trafficData';
export * from './vegetationData';
export * from './riskData';
export * from './insightData';

export const filterOptions = {
  cities: [
    { value: 'all', label: 'All Cities (Metro Region)' },
    { value: 'metropolis', label: 'Metropolis Central' },
    { value: 'east-valley', label: 'East Valley District' },
    { value: 'coastal-bay', label: 'Coastal Bay City' },
  ],
  dateRanges: [
    { value: 'today', label: 'Today (Diurnal Cycle)' },
    { value: '7d', label: 'Past 7 Days' },
    { value: '30d', label: 'Past 30 Days' },
    { value: 'season', label: 'Current Summer Season' },
  ],
  areas: [
    { value: 'all', label: 'All Zones (A to F)' },
    { value: 'central', label: 'Area A (Central)' },
    { value: 'east', label: 'Area B (East)' },
    { value: 'south', label: 'Area C (South)' },
    { value: 'west', label: 'Area D (West)' },
    { value: 'north', label: 'Area E (North)' },
    { value: 'eco-park', label: 'Area F (Eco Park)' },
  ],
  landUses: [
    { value: 'all', label: 'All Land Uses' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'residential', label: 'Residential' },
    { value: 'green-space', label: 'Green Space' },
  ],
};
