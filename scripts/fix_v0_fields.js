const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../components/admin_v0/cocktail-form-dialog.tsx');
let content = fs.readFileSync(file, 'utf8');

const replacements = {
  vibeTitle: 'vibe_title',
  tasteNotes: 'taste_notes',
  glassType: 'glass_type',
  particleEffect: 'particle_effect',
  primaryColor: 'theme_color_primary',
  secondaryColor: 'theme_color_secondary',
  liquidColor: 'liquid_color'
};

for (const [oldKey, newKey] of Object.entries(replacements)) {
  const regex = new RegExp(`(?<![a-zA-Z0-9_])\\"?${oldKey}\\"?(?![a-zA-Z0-9_])`, 'g');
  content = content.replace(regex, newKey);
}

fs.writeFileSync(file, content);
console.log('Done replacing fields in form dialog.');
