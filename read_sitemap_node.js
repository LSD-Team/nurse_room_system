const fs = require('fs');
const path = require('path');

const sitemapPath = 'E:\\GitHub_Repo\\nurse_room_system\\PRD\\sitemap.txt';

try {
  const content = fs.readFileSync(sitemapPath, 'utf-8');
  const outputPath = 'E:\\GitHub_Repo\\nurse_room_system\\sitemap_read.txt';
  
  fs.writeFileSync(outputPath, content, 'utf-8');
  console.log(`File read successfully! Saved to: ${outputPath}`);
  console.log(`Content length: ${content.length} characters`);
  console.log('\n=== FIRST 5000 CHARACTERS ===\n');
  console.log(content.substring(0, 5000));
  console.log('\n... (rest truncated)');
} catch (error) {
  console.error('Error reading file:', error.message);
}
