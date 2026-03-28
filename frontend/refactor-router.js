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

    // Replace react-router imports
    if (content.includes('react-router')) {
      content = content.replace(/from ['"]react-router['"]/g, 'from "next/navigation"');
      content = content.replace(/import { useNavigate } from ['"]next\/navigation['"]/g, 'import { useRouter } from "next/navigation"');
      content = content.replace(/import { useNavigate, useLocation } from ['"]next\/navigation['"]/g, 'import { useRouter, usePathname } from "next/navigation"');
      content = content.replace(/import { useLocation } from ['"]next\/navigation['"]/g, 'import { usePathname } from "next/navigation"');
      content = content.replace(/import { useParams } from ['"]next\/navigation['"]/g, 'import { useParams } from "next/navigation"');
      changed = true;
    }

    // Replace useNavigate() with useRouter()
    if (content.includes('useNavigate()')) {
      content = content.replace(/useNavigate\(\)/g, 'useRouter()');
      changed = true;
    }

    // Replace navigate( with router.push( or router.back()
    if (content.includes('navigate(')) {
      content = content.replace(/navigate\(-1\)/g, 'router.back()');
      content = content.replace(/navigate\(/g, 'router.push(');
      // Ensure router is used instead of navigate
      content = content.replace(/const navigate = useRouter\(\);/g, 'const router = useRouter();');
      changed = true;
    }

    // Replace useLocation with usePathname
    if (content.includes('useLocation()')) {
      content = content.replace(/useLocation\(\)/g, 'usePathname()');
      content = content.replace(/const location = usePathname\(\);/g, 'const pathname = usePathname();');
      changed = true;
    }

    // Replace Link from react-router with Link from next/link
    if (content.match(/import.* Link .*from ['"]next\/navigation['"]/)) {
      content = content.replace(/import { (.*)Link(.*) } from ['"]next\/navigation['"]/g, 'import { $1Link$2 } from "next/link"');
      changed = true;
    }

    // Replace <Link to="..." with <Link href="..."
    if (content.includes('<Link to=')) {
      content = content.replace(/<Link to=/g, '<Link href=');
      changed = true;
    }

    // Replace Outlet with children (this is harder to automate perfectly, but let's try some common cases)
    if (content.includes('<Outlet />')) {
      content = content.replace(/<Outlet \/>/g, '{children}');
      if (!content.includes('children: React.ReactNode')) {
        // This won't fix everything, but it's a start
        content = content.replace(/export default function (.*)\((.*)\) {/g, 'export default function $1({ children }: { children: React.ReactNode }) {');
      }
      changed = true;
    }

    if (changed) {
      console.log(`Updated ${filePath}`);
      fs.writeFileSync(filePath, content);
    }
  }
});
