const express = require('express');
const router = express.Router();
const multer = require('multer');
const importController = require('../controllers/importController');

// Memory storage configuration with 10MB file limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.originalname.toLowerCase().endsWith('.csv') || file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only .csv files are supported for ingestion'));
    }
  },
});

router.get('/template', importController.downloadTemplate);
router.post('/validate', upload.single('file'), importController.uploadAndValidate);
router.post('/commit', importController.commitImport);
router.get('/history', importController.getHistory);
router.get('/:id', importController.getJobDetails);
router.get('/:id/errors', importController.exportErrors);
router.delete('/:id', importController.deleteJob);

module.exports = router;
