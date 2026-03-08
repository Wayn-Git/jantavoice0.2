const fs = require('fs');

const files = [
    './controllers/complaintController.js',
    './controllers/govPortalController.js',
    './controllers/automationController.js',
    './controllers/callController.js',
    './services/escalationService.js'
];

files.forEach(f => {
    if (!fs.existsSync(f)) return;
    let content = fs.readFileSync(f, 'utf-8');

    // Replace import (exact match or similar)
    content = content.replace(
        /const Notification = require\(['"]\.\.\/models\/Notification['"]\);?/g,
        "const Notification = (() => { try { return require('../models/Notification'); } catch { return null; } })();"
    );

    // Replace await Notification.create safely without breaking syntax.
    // Actually, we can just replace `await Notification.create({` that are NOT preceded by `if (Notification)`.
    // A negative lookbehind for `if (Notification) ` is useful.
    content = content.replace(
        /(?<!if\s*\(\s*Notification\s*\)\s*)await Notification\.create/g,
        "if (Notification) await Notification.create"
    );

    fs.writeFileSync(f, content);
});
