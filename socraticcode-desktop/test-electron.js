const { app } = require('electron');
console.log('app object:', typeof app);
console.log('app.whenReady:', typeof app.whenReady);

if (app && app.whenReady) {
    console.log('✅ Electron app is working!');
    app.quit();
} else {
    console.log('❌ Electron app is undefined!');
    process.exit(1);
}

