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
      // Replace useNavigate with useRouter
      if (content.includes('useNavigate')) {
        content = content.replace(/useNavigate/g, 'useRouter');
        changed = true;
      }
      
      // Replace useLocation with usePathname
      if (content.includes('useLocation')) {
        content = content.replace(/useLocation/g, 'usePathname');
        changed = true;
      }

      // Ensure no NavLink or Outlet
      content = content.replace(/NavLink,?\s*/g, '');
      content = content.replace(/Outlet,?\s*/g, '');
      
      // Cleanup trailing commas in imports
      content = content.replace(/,(\s*})/g, '$1');
      content = content.replace(/{(\s*),/g, '{$1');
      
      changed = true;
    }

    if (content.includes('useNavigate()')) {
        content = content.replace(/useNavigate\(\)/g, 'useRouter()');
        changed = true;
    }
    
    if (content.includes('useLocation()')) {
        content = content.replace(/useLocation\(\)/g, 'usePathname()');
        changed = true;
    }

    if (changed) {
      console.log(`Deep cleaning in ${filePath}`);
      fs.writeFileSync(filePath, content);
    }
  }
});
