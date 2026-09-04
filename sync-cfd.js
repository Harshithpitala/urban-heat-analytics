const path = require('path');
const mongoose = require(path.join(__dirname, 'server', 'node_modules', 'mongoose'));
const dotenv = require(path.join(__dirname, 'server', 'node_modules', 'dotenv'));
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

async function syncCFD() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/urban_heat_analytics';
    await mongoose.connect(uri);
    const Area = mongoose.model('Area', new mongoose.Schema({}, { strict: false }));
    const Record = mongoose.model('EnvironmentalRecord', new mongoose.Schema({}, { strict: false }));

    const area = await Area.findOne({ name: /Central Financial District/i });
    if (!area) {
      console.log('Central Financial District not found.');
      process.exit(1);
    }

    console.log('Found Area in Atlas: ' + area.name);
    console.log('  Area.vegetation: ' + area.vegetation + '%');
    console.log('  Area.populationDensity: ' + area.populationDensity + ' /km²');

    // Sync all time-series observations in environmentalrecords to match Area values!
    const result = await Record.updateMany(
      { area: area._id },
      { $set: { vegetation: area.vegetation, populationDensity: area.populationDensity } }
    );

    console.log('Successfully synchronized ' + result.modifiedCount + ' records in environmentalrecords collection!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

syncCFD();
