const fs = require('fs');
const path = require('path');

function searchDir(dir, pattern) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        searchDir(filePath, pattern);
      }
    } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.json'))) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes(pattern)) {
        console.log(`Found "${pattern}" in: ${filePath}`);
        // print matching lines
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes(pattern)) {
            console.log(`  L${index + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

console.log('Searching for "isPremium"...');
searchDir(path.join(__dirname, '..'), 'isPremium');

console.log('\nSearching for "setPremium"...');
searchDir(path.join(__dirname, '..'), 'setPremium');
