import { openDatabase } from './db.js';
import { seed } from './seed.js';
import { createApp } from './app.js';

const db = openDatabase();
if (seed(db)) console.log('Seeded a fresh database with demo catalog, stores and accounts.');

const port = Number(process.env.PORT) || 4000;
createApp(db).listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
