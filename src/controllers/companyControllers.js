const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Company = require('../models/company');

//  validate URL
const isValidUrl = (url) => {
  const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
  return urlRegex.test(url);
};

//  truncate text
const truncate = (text, maxLength) => {
  if (!text) return ''; // Handle undefined or null values
  return text.length > maxLength ? text.substring(0, maxLength) : text;
};

//  create directory if it doesn't exist
const ensureDirectoryExistence = (filePath) => {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
};

//  download image
const downloadImage = async (url, filepath) => {
  try {
    const response = await axios({
      url,
      responseType: 'stream',
    });
    return new Promise((resolve, reject) => {
      response.data.pipe(fs.createWriteStream(filepath))
        .on('error', reject)
        .once('close', () => resolve(filepath));
    });
  } catch (error) {
    console.error(`Failed to download image from ${url}:`, error);
    return null;
  }
};

// Recursive function to extract phone number from nested elements
const extractPhone = ($, element) => {
  let phone = '';
  $(element).children().each((i, child) => {
    const text = $(child).text().trim();
    const match = text.match(/(\+\d{1,2}\s?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/);
    if (match) {
      phone = match[0];
      return false; 
    } else {
      phone = extractPhone($, child); 
      if (phone) return false; 
    }
  });
  return phone;
};

// Function to extract phone number from the HTML
const findPhoneNumber = (html) => {
  const $ = cheerio.load(html);
  let phone = '';
  $('body').each((i, element) => {
    phone = extractPhone($, element);
    if (phone) return false; // Break out of loop once phone number is found
  });
  return phone;
};

// Helper functions to extract address and email
const extractAddress = ($) => {
  let address = '';
  $('p, span, div').each((i, element) => {
    const text = $(element).text().trim();
    const match = text.match(/\d+\s+[A-Za-z]+\s+[A-Za-z]+,?\s+[A-Za-z]+\s*\d*/);
    if (match) {
      address = match[0];
      return false; 
    }
  });
  return address;
};

const extractEmail = ($) => {
  let email = '';
  $('a[href^="mailto:"]').each((i, element) => {
    email = $(element).attr('href').replace('mailto:', '');
    return false; // Break out of loop once email is found
  });
  return email;
};

// Main function to scrape and save company details
exports.scrapeAndSaveCompany = async (req, res) => {
  const { url } = req.body;

  console.log('Received URL:', url); 

  if (!isValidUrl(url)) {
    console.log('Invalid URL:', url); 
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Capture screenshot
    const screenshotPath = path.resolve(__dirname, '../screenshots', `${Date.now()}-screenshot.png`);
    ensureDirectoryExistence(screenshotPath);
    await page.setViewport({ width: 1280, height: 720 }); 
    await page.screenshot({ path: screenshotPath });

    const content = await page.content();
    const $ = cheerio.load(content);

    // Handle relative logo URLs
    let logoUrl = $('link[rel="icon"]').attr('href') || $('meta[property="og:image"]').attr('content');
    if (logoUrl && !isValidUrl(logoUrl)) {
      const baseUrl = new URL(url);
      logoUrl = new URL(logoUrl, baseUrl.origin).href;
    }

    const logoPath = path.resolve(__dirname, '../logos', `${Date.now()}-logo.png`);

    // Download logo
    let downloadedLogoPath = '';
    if (logoUrl && isValidUrl(logoUrl)) {
      ensureDirectoryExistence(logoPath);
      downloadedLogoPath = await downloadImage(logoUrl, logoPath);
    }

    const data = {
      name: truncate($('meta[property="og:site_name"]').attr('content') || $('title').text(), 255),
      description: truncate($('meta[name="description"]').attr('content'), 255),
      logo: downloadedLogoPath || '',
      website: url,
      facebook: truncate($('a[href*="facebook.com"]').attr('href'), 255),
      linkedin: truncate($('a[href*="linkedin.com"]').attr('href'), 255),
      twitter: truncate($('a[href*="twitter.com"]').attr('href'), 255),
      instagram: truncate($('a[href*="instagram.com"]').attr('href'), 255),
      address: truncate(extractAddress($), 255),
      phone: truncate(findPhoneNumber(content), 255),
      email: truncate(extractEmail($), 255),
      screenshot: screenshotPath,
    };

    await browser.close();

    const newCompany = await Company.create(data);
    res.json(newCompany);
  } catch (error) {
    console.error(error); 
    res.status(500).json({ error: 'Failed to scrape and save company' });
  }
};

exports.getAllCompanies = async (req, res) => {
  
  try {
    console.log("========> ",Company);
    const companies = await Company.findAll();
    console.log("----->   ",companies);
    res.json(companies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
}


exports.getCompanyById = async (req, res) => {
  try {
    const companyId = parseInt(req.params.id, 10); 
    if (isNaN(companyId)) {
      return res.status(400).json({ error: 'Invalid company ID' });
    }

    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    console.error(error); 
    res.status(500).json({ error: 'Failed to fetch company' });
  }
};

exports.deleteCompany = async (req, res) => {
  try {
    const companyId = parseInt(req.params.id, 10); 
    if (isNaN(companyId)) {
      return res.status(400).json({ error: 'Invalid company ID' });
    }

    await Company.destroy({ where: { id: companyId } });
    res.sendStatus(204);
  } catch (error) {
    console.error(error); 
    res.status(500).json({ error: 'Failed to delete company' });
  }
};
