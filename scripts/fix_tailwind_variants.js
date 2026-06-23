const fs = require('fs');
const path = require('path');

function replaceFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  content = content.replace(/data-disabled:/g, 'data-[disabled]:');
  content = content.replace(/data-checked:/g, 'data-[state=checked]:');
  content = content.replace(/data-unchecked:/g, 'data-[state=unchecked]:');
  fs.writeFileSync(filepath, content);
}

replaceFile(path.join(__dirname, '../components/ui/select.tsx'));
replaceFile(path.join(__dirname, '../components/ui/switch.tsx'));
console.log('Done.');
