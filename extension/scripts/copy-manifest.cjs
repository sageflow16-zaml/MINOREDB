const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '../dist');

fs.copyFileSync(
  path.resolve(__dirname, '../manifest.json'),
  path.join(distDir, 'manifest.json')
);

const iconDir = path.join(distDir, 'icons');
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

const srcIconDir = path.resolve(__dirname, '../public/icons');
if (fs.existsSync(srcIconDir)) {
  for (const file of fs.readdirSync(srcIconDir)) {
    fs.copyFileSync(
      path.join(srcIconDir, file),
      path.join(iconDir, file)
    );
  }
}

console.log('Copied manifest.json and icons to dist/');
