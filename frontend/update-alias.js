const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, callback);
    } else {
      callback(fullPath);
    }
  });
}

const baseDir = path.join(__dirname, 'src');

walk(baseDir, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    if (content.includes('@/pages/')) {
      content = content.replace(/@\/pages\//g, '@/modules/');
      changed = true;
    }

    if (changed) {
      console.log(`Updated alias in ${filePath}`);
      fs.writeFileSync(filePath, content);
    }
  }
});
