const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connectDB = require('../config/db');
const Area = require('../models/Area');
const EnvironmentalRecord = require('../models/EnvironmentalRecord');

/**
 * Deterministic Pseudo-Random Number Generator (LCG)
 * Ensures reproducible seed datasets across multiple environments.
 */
class DeterministicRNG {
  constructor(seed = 424242) {
    this.seed = seed;
  }

  next() {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  range(min, max) {
    return min + this.next() * (max - min);
  }
}

// 10 Distinct Urban Areas with Realistic Baseline Characteristics
const BASE_AREAS = [
  {
    name: 'Central Financial District',
    city: 'Metro City',
    zone: 'Central Zone',
    latitude: 28.6139,
    longitude: 77.2090,
    landUse: 'Commercial',
    populationDensity: 16500,
    buildingDensity: 88,
    vegetation: 12,
    baseTemp: 39.2,
    baseTraffic: 88,
    description: 'High-density commercial core with intense heat entrapment from skyscrapers and air-conditioning exhaust.',
  },
  {
    name: 'East Industrial Corridor',
    city: 'Metro City',
    zone: 'East Zone',
    latitude: 28.6315,
    longitude: 77.2800,
    landUse: 'Industrial',
    populationDensity: 9200,
    buildingDensity: 82,
    vegetation: 8,
    baseTemp: 38.7,
    baseTraffic: 92,
    description: 'Heavy industrial sector with extensive asphalt and metal roofing generating severe localized thermal anomalies.',
  },
  {
    name: 'North Garden Hills',
    city: 'Metro City',
    zone: 'North Zone',
    latitude: 28.7041,
    longitude: 77.1025,
    landUse: 'Residential',
    populationDensity: 6400,
    buildingDensity: 42,
    vegetation: 56,
    baseTemp: 30.5,
    baseTraffic: 35,
    description: 'Elevated residential suburb with abundant tree canopy cover delivering effective microclimate cooling.',
  },
  {
    name: 'South Tech Campus',
    city: 'Metro City',
    zone: 'South Zone',
    latitude: 28.5355,
    longitude: 77.2410,
    landUse: 'Commercial',
    populationDensity: 13800,
    buildingDensity: 74,
    vegetation: 22,
    baseTemp: 36.4,
    baseTraffic: 76,
    description: 'Commercial technology hub with moderate vegetation buffers and high vehicular commute volumes.',
  },
  {
    name: 'West Residential Belt',
    city: 'Metro City',
    zone: 'West Zone',
    latitude: 28.6280,
    longitude: 77.0850,
    landUse: 'Residential',
    populationDensity: 11500,
    buildingDensity: 62,
    vegetation: 32,
    baseTemp: 33.8,
    baseTraffic: 54,
    description: 'Mid-density residential apartment blocks with community gardens and balanced urban infrastructure.',
  },
  {
    name: 'Riverside Eco Reserve',
    city: 'Metro City',
    zone: 'Green Zone',
    latitude: 28.5800,
    longitude: 77.3000,
    landUse: 'Green Space',
    populationDensity: 1800,
    buildingDensity: 8,
    vegetation: 84,
    baseTemp: 27.4,
    baseTraffic: 14,
    description: 'Protected riparian wetland and urban forestry park creating an active regional cooling sink.',
  },
  {
    name: 'Metro Transit Interchange',
    city: 'Metro City',
    zone: 'Central Zone',
    latitude: 28.6400,
    longitude: 77.2180,
    landUse: 'Transportation',
    populationDensity: 14800,
    buildingDensity: 80,
    vegetation: 14,
    baseTemp: 38.1,
    baseTraffic: 94,
    description: 'Multi-modal transit junction with high diesel bus throughput and heat-retaining concrete platforms.',
  },
  {
    name: 'University & Medical District',
    city: 'Metro City',
    zone: 'North Zone',
    latitude: 28.6900,
    longitude: 77.1600,
    landUse: 'Institutional',
    populationDensity: 8200,
    buildingDensity: 52,
    vegetation: 46,
    baseTemp: 31.8,
    baseTraffic: 48,
    description: 'Spacious academic campus with shaded walkways, brick structures, and grass lawns.',
  },
  {
    name: 'Harbor Logistics Depot',
    city: 'Metro City',
    zone: 'Outer Zone',
    latitude: 28.5000,
    longitude: 77.1200,
    landUse: 'Industrial',
    populationDensity: 4100,
    buildingDensity: 70,
    vegetation: 10,
    baseTemp: 37.6,
    baseTraffic: 86,
    description: 'Freight warehousing and shipping container yards with wide asphalt pavements and unshaded docks.',
  },
  {
    name: 'Suburban Green Valley',
    city: 'Metro City',
    zone: 'Outer Zone',
    latitude: 28.4600,
    longitude: 77.3200,
    landUse: 'Mixed Use',
    populationDensity: 5200,
    buildingDensity: 36,
    vegetation: 68,
    baseTemp: 29.2,
    baseTraffic: 28,
    description: 'Low-density periphery development integrating single-family homes with open agricultural belts.',
  },
];

const seedDatabase = async () => {
  console.log('====================================================');
  console.log('  URBAN HEAT ANALYTICS — SEED DATA INGESTION');
  console.log('  Generating deterministic synthetic demonstration dataset');
  console.log('====================================================');

  const rng = new DeterministicRNG(123456);

  try {
    await connectDB();

    // 1. Clear intended demo collections only
    console.log('[Seed] Clearing existing demo collections (Area, EnvironmentalRecord)...');
    await Area.deleteMany({});
    await EnvironmentalRecord.deleteMany({});
    console.log('[Seed] Collections cleared successfully.');

    // 2. Insert 10 Urban Areas
    console.log('[Seed] Inserting 10 urban areas...');
    const createdAreas = await Area.insertMany(
      BASE_AREAS.map((a) => ({
        name: a.name,
        city: a.city,
        zone: a.zone,
        latitude: a.latitude,
        longitude: a.longitude,
        landUse: a.landUse,
        populationDensity: a.populationDensity,
        buildingDensity: a.buildingDensity,
        vegetation: a.vegetation,
        description: a.description,
      }))
    );
    console.log(`[Seed] Successfully created ${createdAreas.length} Area records.`);

    // 3. Generate Time-Series Environmental Observations (35 dates x 2 time slots = 700 records)
    console.log('[Seed] Generating time-series environmental observation records...');
    const recordsToInsert = [];
    const DAYS_COUNT = 35;
    const now = new Date();

    for (let dayOffset = DAYS_COUNT - 1; dayOffset >= 0; dayOffset--) {
      // Calculate date
      const observationDate = new Date(now);
      observationDate.setUTCDate(now.getUTCDate() - dayOffset);
      observationDate.setUTCHours(0, 0, 0, 0);

      // Synoptic weather wave (e.g. heatwave cycle every 10-12 days)
      const synopticWave = Math.sin((dayOffset / 5.5) * Math.PI) * 2.8;
      const seasonalBase = Math.cos((dayOffset / 18) * Math.PI) * 1.5;

      // Rainfall probability: rain occurs on 5 out of 35 days deterministically
      const isRainyDay = dayOffset === 8 || dayOffset === 17 || dayOffset === 29;
      const rainfallAmount = isRainyDay ? Number((rng.range(12, 38)).toFixed(1)) : 0;

      // Two diurnal slots per day: Morning (08:00) and Peak Afternoon (14:00)
      const slots = [
        { hour: 8, tempOffset: -3.2, trafficFactor: 0.9, humidityOffset: +8 },
        { hour: 14, tempOffset: +2.8, trafficFactor: 1.1, humidityOffset: -12 },
      ];

      for (const slot of slots) {
        const slotDate = new Date(observationDate);
        slotDate.setUTCHours(slot.hour, 0, 0, 0);

        for (let i = 0; i < createdAreas.length; i++) {
          const areaDoc = createdAreas[i];
          const base = BASE_AREAS[i];

          // Temperature formula: base + weather wave + diurnal + random jitter - rain cooling
          const jitter = rng.range(-0.8, 0.8);
          const rainCooling = isRainyDay ? 4.5 : 0;
          let temp = base.baseTemp + synopticWave + seasonalBase + slot.tempOffset + jitter - rainCooling;
          temp = Number(Math.max(18, Math.min(46.5, temp)).toFixed(1));

          // Humidity inverse correlation: higher when rain or lower temp
          let humidity = 62 - (temp - 30) * 1.8 + slot.humidityOffset + (isRainyDay ? 24 : 0) + rng.range(-3, 3);
          humidity = Math.round(Math.max(22, Math.min(96, humidity)));

          // Traffic: area base * time factor + weekend reduction (dayOffset % 7 === 0 or 1)
          const isWeekend = (dayOffset % 7 === 0 || dayOffset % 7 === 6);
          const weekendFactor = isWeekend ? 0.72 : 1.0;
          let traffic = Math.round(base.baseTraffic * slot.trafficFactor * weekendFactor + rng.range(-5, 5));
          traffic = Math.max(8, Math.min(99, traffic));

          // Dynamic vegetation: seasonal slight variation
          const vegJitter = rng.range(-2, 2);
          const vegetation = Math.round(Math.max(5, Math.min(95, base.vegetation + vegJitter)));

          recordsToInsert.push({
            area: areaDoc._id,
            date: slotDate,
            temperature: temp,
            humidity,
            rainfall: slot.hour === 14 ? rainfallAmount : 0,
            vegetation,
            traffic,
            populationDensity: base.populationDensity,
            buildingDensity: base.buildingDensity,
            landUse: base.landUse,
            city: base.city,
            latitude: base.latitude,
            longitude: base.longitude,
          });
        }
      }
    }

    console.log(`[Seed] Inserting ${recordsToInsert.length} environmental records into MongoDB...`);
    await EnvironmentalRecord.insertMany(recordsToInsert);

    console.log('----------------------------------------------------');
    console.log(`[Seed Success] Completed database seeding!`);
    console.log(`  - Areas Inserted: ${createdAreas.length}`);
    console.log(`  - Environmental Observations: ${recordsToInsert.length}`);
    console.log(`  - Date Span: ${DAYS_COUNT} days (Diurnal 08:00 & 14:00 time slots)`);
    console.log(`  - Mode: Deterministic synthetic demonstration records`);
    console.log('----------------------------------------------------');

    await mongoose.connection.close();
    console.log('[Seed] MongoDB connection closed cleanly.');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Fatal Error]', error);
    process.exit(1);
  }
};

seedDatabase();
