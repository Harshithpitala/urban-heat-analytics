const express = require('express');
const router = express.Router();
const environmentalDataController = require('../controllers/environmentalDataController');

// Data quality endpoint (must be registered before :id param)
router.get('/quality', environmentalDataController.getDataQuality);

router.get('/', environmentalDataController.getRecords);
router.get('/:id', environmentalDataController.getRecordById);
router.post('/', environmentalDataController.createRecord);
router.put('/:id', environmentalDataController.updateRecord);
router.delete('/:id', environmentalDataController.deleteRecord);

module.exports = router;
