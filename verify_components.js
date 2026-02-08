const fs = require('fs');
const path = require('path');

const filesToCheck = [
    'h:\\frontend\\VedSAAS-frontend\\index.html',
    'h:\\frontend\\VedSAAS-frontend\\investor.html',
    'h:\\frontend\\VedSAAS-frontend\\about.html',
    'h:\\frontend\\VedSAAS-frontend\\privacy.html',
    'h:\\frontend\\VedSAAS-frontend\\terms.html',
    'h:\\frontend\\VedSAAS-frontend\\subdomains\\contact\\contact.html',
    'h:\\frontend\\VedSAAS-frontend\\subdomains\\help\\help.html',
    'h:\\frontend\\VedSAAS-frontend\\subdomains\\careers\\careers.html',
    'h:\\frontend\\VedSAAS-frontend\\subdomains\\docs\\docs.html'
];

let allPassed = true;

filesToCheck.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('<div id="footer-placeholder"></div>')) {
            console.log(`[PASS] ${path.basename(file)} contains footer placeholder.`);
        } else {
            console.error(`[FAIL] ${path.basename(file)} does NOT contain footer placeholder.`);
            allPassed = false;
        }

        if (content.includes('loadFooter();') || fs.readFileSync('h:\\frontend\\VedSAAS-frontend\\public\\js\\components.js', 'utf8').includes('loadFooter')) {
            // Implicitly covered by components.js check, but good to know
        }

    } catch (e) {
        console.error(`[ERROR] Could not read ${file}: ${e.message}`);
        allPassed = false;
    }
});

if (allPassed) {
    console.log('\nAll files verified successfully.');
} else {
    console.log('\nVerification failed for some files.');
}
