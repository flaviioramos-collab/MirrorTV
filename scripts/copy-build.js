const fs = require('fs');
const path = require('path');

function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const files = fs.readdirSync(src);
  
  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

try {
  console.log('Copiando arquivos de build...');
  
  // Copiar static
  const staticSrc = path.join(__dirname, '../.next/static');
  const staticDest = path.join(__dirname, '../.next/standalone/.next/static');
  if (fs.existsSync(staticSrc)) {
    copyRecursive(staticSrc, staticDest);
    console.log('✓ Static copiado');
  }
  
  // Copiar public
  const publicSrc = path.join(__dirname, '../public');
  const publicDest = path.join(__dirname, '../.next/standalone/public');
  if (fs.existsSync(publicSrc)) {
    copyRecursive(publicSrc, publicDest);
    console.log('✓ Public copiado');
  }
  
  console.log('✓ Build concluído!');
} catch (err) {
  console.error('Erro ao copiar arquivos:', err);
  process.exit(1);
}
