const { execSync } = require('child_process');
const fs = require('fs');

console.log('Adding Android platform for SRM Nexus...');
try {
  const result = execSync('npx cap add android', { encoding: 'utf8', stdio: 'pipe' });
  console.log(result);
  console.log('Android platform successfully added!');
} catch (err) {
  console.error('Error adding android platform:', err.stdout || err.message);
}
