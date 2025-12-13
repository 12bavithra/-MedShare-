// Bootstrapper to start the backend server from project root with `node server.js`
// It loads `backend/src/server.js` (ESM) so the server serves APIs and static frontend.

const path = require('path');
const { pathToFileURL } = require('url');

(async () => {
  try {
    const backendEntry = path.resolve(__dirname, 'backend', 'src', 'server.js');
    const backendUrl = pathToFileURL(backendEntry).href;
    await import(backendUrl);
  } catch (err) {
    console.error('Failed to start backend server from server.js:', err);
    process.exit(1);
  }
})();


