const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, 'node_modules', '@splinetool', 'react-spline', 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (pkg.exports && pkg.exports['.'] && !pkg.exports['.'].default) {
    pkg.exports['.'].default = pkg.exports['.'].import;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    console.log('Successfully patched @splinetool/react-spline package.json exports!');
  }
}
