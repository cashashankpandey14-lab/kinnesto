// Runs the API against a throwaway in-memory MongoDB (no install needed) and
// seeds demo members and listings. Data is lost when you stop it.
// Usage: npm run dev:memory
const { MongoMemoryServer } = require('mongodb-memory-server');
const { spawnSync } = require('child_process');
const path = require('path');

(async () => {
  const mongo = await MongoMemoryServer.create({ instance: { port: 27019, launchTimeout: 90000 } });
  process.env.MONGODB_URI = mongo.getUri('kinnesto');
  process.env.DEMO_AUTO_REPLY = 'true';
  // Sign in as the demo account below to try the admin dashboard locally.
  process.env.ADMIN_EMAILS = process.env.ADMIN_EMAILS || 'ananya@demo.kinnesto.app';
  console.log(`In-memory MongoDB at ${process.env.MONGODB_URI}`);

  spawnSync(process.execPath, [path.join(__dirname, 'seed.js')], { stdio: 'inherit', env: process.env });

  await require('./index').main();
})();
