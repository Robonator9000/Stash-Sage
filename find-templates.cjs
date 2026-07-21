const fs = require('fs');
const content = fs.readFileSync('src/components/LeftSidebar.tsx', 'utf8');
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('${') && lines[i].includes('className')) {
    console.log(i+1 + ': ' + lines[i]);
  }
}