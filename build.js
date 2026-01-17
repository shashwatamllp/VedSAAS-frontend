const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const destDir = path.join(__dirname, 'www');

// Allowed files/folders to copy
const whitelist = [
    'index.html',
    'manifest.json',
    'sw.js',
    'pwa-init.js',
    'favicon.ico',
    'chat',
    'public',
    'admin',
    'components',
    'subdomains'
];

function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();

    if (isDirectory) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest);
        fs.readdirSync(src).forEach(childItemName => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

function build() {
    console.log('Building for Capacitor...');

    // Clean
    if (fs.existsSync(destDir)) {
        fs.rmSync(destDir, { recursive: true, force: true });
    }
    fs.mkdirSync(destDir);

    // Copy
    whitelist.forEach(item => {
        const srcPath = path.join(srcDir, item);
        const destPath = path.join(destDir, item);

        if (fs.existsSync(srcPath)) {
            console.log(`Copying ${item}...`);
            copyRecursiveSync(srcPath, destPath);
        } else {
            console.warn(`Warning: ${item} not found.`);
        }
    });

    console.log('Build complete! Assets ready in ./www');
}

build();
