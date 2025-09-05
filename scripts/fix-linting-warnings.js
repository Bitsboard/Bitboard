#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of files with linting warnings and their fixes
const fixes = [
  {
    file: 'src/components/LocationModal.tsx',
    fixes: [
      {
        // Fix duplicate CSS classes in conditional statements
        search: /className={cn\("([^"]*?)",\s*dark\s*\?\s*"([^"]*?)"\s*:\s*"([^"]*?)"\)}/g,
        replace: (match, base, darkClass, lightClass) => {
          // Remove duplicate classes
          const baseClasses = base.split(' ').filter(Boolean);
          const darkClasses = darkClass.split(' ').filter(Boolean);
          const lightClasses = lightClass.split(' ').filter(Boolean);
          
          // Remove duplicates
          const uniqueDark = [...new Set(darkClasses)];
          const uniqueLight = [...new Set(lightClasses)];
          
          return `className={cn("${baseClasses.join(' ')}", dark ? "${uniqueDark.join(' ')}" : "${uniqueLight.join(' ')}")}`;
        }
      }
    ]
  },
  {
    file: 'src/components/ChatModal.tsx',
    fixes: [
      {
        // Fix duplicate CSS classes
        search: /className={cn\("([^"]*?)",\s*dark\s*\?\s*"([^"]*?)"\s*:\s*"([^"]*?)"\)}/g,
        replace: (match, base, darkClass, lightClass) => {
          const baseClasses = base.split(' ').filter(Boolean);
          const darkClasses = darkClass.split(' ').filter(Boolean);
          const lightClasses = lightClass.split(' ').filter(Boolean);
          
          const uniqueDark = [...new Set(darkClasses)];
          const uniqueLight = [...new Set(lightClasses)];
          
          return `className={cn("${baseClasses.join(' ')}", dark ? "${uniqueDark.join(' ')}" : "${uniqueLight.join(' ')}")}`;
        }
      }
    ]
  }
];

function fixFile(filePath, fileFixes) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    fileFixes.forEach(fix => {
      if (typeof fix.replace === 'function') {
        const newContent = content.replace(fix.search, fix.replace);
        if (newContent !== content) {
          content = newContent;
          modified = true;
        }
      } else {
        const newContent = content.replace(fix.search, fix.replace);
        if (newContent !== content) {
          content = newContent;
          modified = true;
        }
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing linting warnings...\n');
  
  let totalFixed = 0;
  
  fixes.forEach(({ file, fixes: fileFixes }) => {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      if (fixFile(fullPath, fileFixes)) {
        totalFixed++;
      }
    } else {
      console.log(`⚠️  File not found: ${file}`);
    }
  });
  
  console.log(`\n🎉 Fixed ${totalFixed} files`);
}

if (require.main === module) {
  main();
}

module.exports = { fixFile, fixes };
