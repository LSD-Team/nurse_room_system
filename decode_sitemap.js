const fs = require('fs');
const path = require('path');

const sitemapPath = 'E:\\GitHub_Repo\\nurse_room_system\\PRD\\sitemap.txt';

try {
  let content = fs.readFileSync(sitemapPath, 'utf-8');
  
  // URL decode the content
  content = decodeURIComponent(content);
  
  // Extract text values from mxCell elements
  const textValues = [];
  const regex = /value="([^"]+)"/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const text = match[1];
    // Filter out system values like "0", "1", etc and keep meaningful text
    if (text.length > 2 && !text.match(/^[\d%\-\.,;]+$/)) {
      textValues.push(text);
    }
  }
  
  // Remove duplicates and write to file
  const uniqueValues = [...new Set(textValues)];
  const output = uniqueValues.join('\n');
  
  fs.writeFileSync('E:\\GitHub_Repo\\nurse_room_system\\sitemap_extracted.txt', output, 'utf-8');
  
  console.log('Extracted text values:');
  console.log(output);
  console.log(`\n\nTotal unique items: ${uniqueValues.length}`);
  console.log('Saved to: E:\\GitHub_Repo\\nurse_room_system\\sitemap_extracted.txt');
  
} catch (error) {
  console.error('Error:', error.message);
}
