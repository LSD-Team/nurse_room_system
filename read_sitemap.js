const fs = require('fs');
const path = require('path');

const sitemapPath = path.join(__dirname, 'PRD', 'sitemap.txt');
const content = fs.readFileSync(sitemapPath, 'utf-8');
console.log(content);
