const fs = require('fs');
const path = require('path');

const logoSource = path.join(__dirname, '../public/nexus-logo.png');
const resDir = path.join(__dirname, '../android/app/src/main/res');

const mipmapFolders = [
  'mipmap-hdpi',
  'mipmap-mdpi',
  'mipmap-xhdpi',
  'mipmap-xxhdpi',
  'mipmap-xxxhdpi',
];

if (fs.existsSync(logoSource)) {
  mipmapFolders.forEach((folder) => {
    const targetDir = path.join(resDir, folder);
    if (fs.existsSync(targetDir)) {
      fs.copyFileSync(logoSource, path.join(targetDir, 'ic_launcher.png'));
      fs.copyFileSync(logoSource, path.join(targetDir, 'ic_launcher_round.png'));
      fs.copyFileSync(logoSource, path.join(targetDir, 'ic_launcher_foreground.png'));
    }
  });
  console.log('Successfully set SRM Nexus logo as Android app icon across all screen densities!');
} else {
  console.error('nexus-logo.png not found in public folder');
}
