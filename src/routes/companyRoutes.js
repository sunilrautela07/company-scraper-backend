const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyControllers.js');

router.post('/scrape', companyController.scrapeAndSaveCompany);
router.get('/', companyController.getAllCompanies);
router.get('/:id', companyController.getCompanyById);
router.delete('/:id', companyController.deleteCompany);
router.get('/:filename', (req, res) => {
    const { filename } = req.params;
    const screenshotsDir = path.join(__dirname, '../src/screenshots');
    res.sendFile(`${filename}`, { root: screenshotsDir });
  });

module.exports = router;
