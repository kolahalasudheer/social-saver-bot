import app from '../src/app.js';

function print(path, layer) {
    if (layer.route) {
        // Simple route
        const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
        console.log('%s %s', methods, path + layer.route.path);
    } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
        // Sub-router
        const subPath = layer.regexp.source
            .replace('\\/?(?=\\/|$)', '')
            .replace('^', '')
            .replace('\\/', '/');
        layer.handle.stack.forEach(l => print(path + subPath, l));
    }
}

if (app._router && app._router.stack) {
    console.log('--- REGISTERED ROUTES ---');
    app._router.stack.forEach(layer => print('', layer));
    console.log('-------------------------');
    process.exit(0);
} else {
    console.log('No routes found or app not initialized.');
    process.exit(1);
}
