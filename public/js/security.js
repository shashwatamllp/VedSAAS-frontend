/**
 * VedSAAS Security Shield
 * 1. Disables Right Click
 * 2. Disables F12 (DevTools)
 * 3. Disables View Source Shortcuts
 * 4. Prints Warning in Console
 */

// 1. Disable Right Click
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
});

// 2. Disable Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    // F12
    if (e.key === 'F12') {
        e.preventDefault();
        return false;
    }

    // Ctrl + Shift + I (Inspect)
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
    }

    // Ctrl + Shift + J (Console)
    if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
    }

    // Ctrl + U (View Source)
    if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return false;
    }
});

// 3. Clear Console (Stealth)
console.clear();
console.log("%c🛑 WAIT!", "color: red; font-size: 50px; font-weight: bold;");
console.log("%cThis is a protected area of the VedSAAS Civilization. Access is restricted.", "font-size: 16px;");

