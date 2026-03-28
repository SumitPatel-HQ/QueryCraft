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
    let lines = fs.readFileSync(filePath, 'utf8').split('\n');
    let newLines = lines.filter(line => {
        // Remove lines that just have "from '...'" without an import keyword
        if (line.trim().startsWith('from "') || line.trim().startsWith("from '")) {
            return false;
        }
        // Remove empty import statements like "import {} from '...'"
        if (line.trim().includes('import {  } from') || line.trim().includes('import {} from')) {
            return false;
        }
        return true;
    });

    if (lines.length !== newLines.length) {
      console.log(`Final import cleanup in ${filePath}`);
      fs.writeFileSync(filePath, newLines.join('\n'));
    }
  }
});
