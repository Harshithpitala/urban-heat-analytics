const path = require('path');
const mongoose = require(path.join(__dirname, 'server', 'node_modules', 'mongoose'));

const dotenv = require(path.join(__dirname, 'server', 'node_modules', 'dotenv'));
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

async function heatUp() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/urban_heat_analytics';
    await mongoose.connect(uri);
    const Area = mongoose.model('Area', new mongoose.Schema({}, { strict: false }));
    const Record = mongoose.model('EnvironmentalRecord', new mongoose.Schema({}, { strict: false }));

    const area = await Area.findOne({ name: 'Central Financial District' });
    if (!area) {
      console.log('Central Financial District not found.');
      process.exit(1);
    }

    // Change to hot (42°C) and low trees (8%)
    await Area.updateOne({ _id: area._id }, { $set: { vegetation: 8 } });
    await Record.updateMany(
      { area: area._id },
      { $set: { temperature: 42.0, vegetation: 8 } }
    );

    console.log('========================================================');
    console.log('  HEATED UP! Central Financial District Updated:');
    console.log('  - Temperature: Changed to 42.0°C (Hot heatwave!)');
    console.log('  - Vegetation:  Changed to 8% (Sparse trees)');
    console.log('========================================================');
    console.log('Now refresh your browser at: http://localhost:5173/risk-index');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

heatUp();
