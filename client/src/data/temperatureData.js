/**
 * Demonstration temperature trend over a 24-hour urban cycle.
 * Used in: Dashboard Temperature Trend Line Chart
 */
export const temperatureTrendData = [
  { time: '00:00', ambientTemp: 27.2, surfaceTemp: 29.1, humidity: 72 },
  { time: '02:00', ambientTemp: 26.5, surfaceTemp: 27.8, humidity: 75 },
  { time: '04:00', ambientTemp: 25.8, surfaceTemp: 26.4, humidity: 78 },
  { time: '06:00', ambientTemp: 26.9, surfaceTemp: 28.0, humidity: 74 },
  { time: '08:00', ambientTemp: 29.4, surfaceTemp: 32.5, humidity: 68 },
  { time: '10:00', ambientTemp: 32.8, surfaceTemp: 37.2, humidity: 60 },
  { time: '12:00', ambientTemp: 35.6, surfaceTemp: 42.1, humidity: 52 },
  { time: '14:00', ambientTemp: 37.4, surfaceTemp: 44.8, humidity: 46 },
  { time: '16:00', ambientTemp: 36.2, surfaceTemp: 41.6, humidity: 50 },
  { time: '18:00', ambientTemp: 33.1, surfaceTemp: 36.4, humidity: 59 },
  { time: '20:00', ambientTemp: 30.5, surfaceTemp: 33.0, humidity: 65 },
  { time: '22:00', ambientTemp: 28.8, surfaceTemp: 30.9, humidity: 69 },
];

export const summaryKpiData = {
  averageTemperature: {
    value: 34.8,
    unit: '°C',
    label: 'Average Temperature',
    supporting: '+1.4°C vs baseline',
    status: 'warning',
  },
  maximumTemperature: {
    value: 42.1,
    unit: '°C',
    label: 'Maximum Temperature',
    supporting: 'Peak recorded at 14:00',
    status: 'danger',
  },
  averageHumidity: {
    value: 61,
    unit: '%',
    label: 'Average Humidity',
    supporting: 'Moderate relative moisture',
    status: 'neutral',
  },
  averageRainfall: {
    value: 18,
    unit: 'mm',
    label: 'Average Rainfall',
    supporting: '-12mm seasonal deficit',
    status: 'neutral',
  },
  highHeatAreas: {
    value: 8,
    unit: 'zones',
    label: 'High Heat Areas',
    supporting: 'Above 38°C critical mark',
    status: 'danger',
  },
  averageHeatIndex: {
    value: 67,
    unit: '/100',
    label: 'Average Heat Index',
    badge: 'Demo Risk Score',
    supporting: 'Elevated moderate risk',
    status: 'warning',
  },
};
