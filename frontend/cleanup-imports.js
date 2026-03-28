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

    // Fix imports from next/navigation
    if (content.includes('from "next/navigation"')) {
      // Remove NavLink and Outlet from imports
      content = content.replace(/import { (.*)NavLink(.*) }/g, (match, p1, p2) => {
        let members = (p1 + p2).split(',').map(m => m.trim()).filter(m => m !== 'NavLink' && m !== '');
        if (members.length === 0) return '';
        return `import { ${members.join(', ')} }`;
      });
      content = content.replace(/import { (.*)Outlet(.*) }/g, (match, p1, p2) => {
        let members = (p1 + p2).split(',').map(m => m.trim()).filter(m => m !== 'Outlet' && m !== '');
        if (members.length === 0) return '';
        return `import { ${members.join(', ')} }`;
      });
      
      // If NavLink or Outlet were removed, we might need Link from next/link
      if (content.includes('<Link') && !content.includes('from "next/link"')) {
         content = 'import Link from "next/link";\n' + content;
      }
      
      changed = true;
    }

    if (changed) {
      console.log(`Cleaned up imports in ${filePath}`);
      fs.writeFileSync(filePath, content);
    }
  }
});
