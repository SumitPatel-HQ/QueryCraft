const fs = require('fs');
const path = require('path');

const dirs = [
  'src/components/ui',
  'src/components/lightswind',
  'src/hooks',
  'src/pages/Home/components',
  'src/pages/Home/sections',
  'src/pages/dashboard',
  'src/pages/dashboard/DatabaseDetail',
  'src/pages/dashboard/chat'
];

dirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) return;
  
  fs.readdirSync(fullPath).forEach(file => {
    if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const filePath = path.join(fullPath, file);
      let content = fs.readFileSync(filePath, 'utf8');
      if (!content.startsWith('"use client";') && !content.startsWith("'use client';")) {
        console.log(`Adding "use client"; to ${filePath}`);
        fs.writeFileSync(filePath, `"use client";\n\n${content}`);
      }
    }
  });
});
