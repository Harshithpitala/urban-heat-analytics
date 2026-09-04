const path = require('path');
const mongoose = require(path.join(__dirname, 'server', 'node_modules', 'mongoose'));

const dotenv = require(path.join(__dirname, 'server', 'node_modules', 'dotenv'));
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

async function coolDown() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/urban_heat_analytics';
    await mongoose.connect(uri);
    const Area = mongoose.model('Area', new mongoose.Schema({}, { strict: false }));
    const Record = mongoose.model('EnvironmentalRecord', new mongoose.Schema({}, { strict: false }));

    // 1. Find Central Financial District
    const area = await Area.findOne({ name: 'Central Financial District' });
    if (!area) {
      console.log('Central Financial District not found.');
      process.exit(1);
    }

    // 2. Change Vegetation from 12% to 80% (Lots of trees!)
    await Area.updateOne({ _id: area._id }, { $set: { vegetation: 80 } });

    // 3. Cool down its temperature to 24°C
    await Record.updateMany(
      { area: area._id },
      { $set: { temperature: 24.0, vegetation: 80 } }
    );

    console.log('========================================================');
    console.log('  SUCCESS! Central Financial District Updated:');
    console.log('  - Temperature: Changed from 38.7°C -> 24.0°C (Cool!)');
    console.log('  - Vegetation:  Changed from 12% -> 80% (Lots of trees!)');
    console.log('========================================================');
    console.log('Now refresh your browser at: http://localhost:5173/risk-index');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

coolDown();
