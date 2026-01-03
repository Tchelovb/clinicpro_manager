const fs = require('fs');
const path = require('path');

function fixImports(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // Skip node_modules and .git
            if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== 'build') {
                fixImports(filePath);
            }
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            let content = fs.readFileSync(filePath, 'utf8');
            let modified = false;

            // Fix double-quoted imports
            const newContent1 = content.replace(/from "\.\.\/lib\/supabase"/g, 'from "../src/lib/supabase"');
            const newContent2 = newContent1.replace(/from "\.\.\/lib\/utils"/g, 'from "../src/lib/utils"');
            const newContent3 = newContent2.replace(/from "\.\.\/\.\.\/lib\/supabase"/g, 'from "../../src/lib/supabase"');
            const newContent4 = newContent3.replace(/from "\.\.\/\.\.\/lib\/utils"/g, 'from "../../src/lib/utils"');

            // Fix single-quoted imports
            const newContent5 = newContent4.replace(/from '\.\.\/lib\/supabase'/g, "from '../src/lib/supabase'");
            const newContent6 = newContent5.replace(/from '\.\.\/lib\/utils'/g, "from '../src/lib/utils'");
            const newContent7 = newContent6.replace(/from '\.\.\/\.\.\/lib\/supabase'/g, "from '../../src/lib/supabase'");
            const newContent8 = newContent7.replace(/from '\.\.\/\.\.\/lib\/utils'/g, "from '../../src/lib/utils'");

            if (content !== newContent8) {
                fs.writeFileSync(filePath, newContent8, 'utf8');
                console.log(`Fixed: ${filePath}`);
                modified = true;
            }
        }
    });
}

console.log('Fixing import paths...');
fixImports(process.cwd());
console.log('Done!');
