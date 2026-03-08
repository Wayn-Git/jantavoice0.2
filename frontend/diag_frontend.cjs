const fs = require('fs');

console.log("=== CHECK 11 ===");
const deps = ['react', 'react-dom', 'react-router-dom', 'axios', 'react-hot-toast'];
deps.forEach(d => {
    try { require('./node_modules/' + d); console.log('✅', d); }
    catch (e) { console.log('❌ MISSING:', d); }
});

console.log("=== CHECK 12 ===");
try {
    const api = fs.readFileSync('./src/services/api.js', 'utf-8');
    const needed = ['aqiAPI', 'callAPI', 'govAPI', 'automationAPI', 'chatbotAPI', 'complaintAPI'];
    needed.forEach(n => console.log(api.includes(n) ? '✅ ' + n : '❌ MISSING export: ' + n));
} catch (e) { console.log('❌ MISSING file:', e.message); }

console.log("=== CHECK 13 ===");
const pages = ['HomePage', 'ReportPage', 'AQIMonitorPage', 'GovTrackerPage', 'AdminPage', 'LoginPage'];
pages.forEach(p => {
    const exists = fs.existsSync('./src/pages/' + p + '.jsx') || fs.existsSync('./src/pages/' + p + '.tsx');
    console.log(exists ? '✅ ' + p : '❌ MISSING PAGE: ' + p);
});

console.log("=== CHECK 14 ===");
const comps = ['ChatBot', 'AQIWidget', 'AnimatedBackground', 'CallPermissionModal', 'CallTranscriptViewer'];
comps.forEach(c => {
    const exists = fs.existsSync('./src/components/' + c + '.jsx') || fs.existsSync('./src/components/' + c + '.tsx');
    console.log(exists ? '✅ ' + c : '❌ MISSING COMPONENT: ' + c);
});

console.log("=== CHECK 15 ===");
try {
    const app = fs.readFileSync('./src/App.jsx', 'utf-8');
    const routes = ['/aqi-monitor', '/gov-tracking', '/report', '/admin', '/my-complaints'];
    routes.forEach(r => console.log(app.includes(r) ? '✅ route ' + r : '❌ MISSING route: ' + r));
    const comps2 = ['AnimatedBackground', 'ChatBot', 'AQIWidget'];
    comps2.forEach(c => console.log(app.includes(c) ? '✅ ' + c + ' rendered' : '❌ NOT rendered: ' + c));
} catch (e) { console.log('❌ MISSING file:', e.message); }
