import app from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/environment.js';
import { initializeFirebase } from './config/firebase.js';

const startServer = async () => {
  await connectDatabase();
  initializeFirebase();

  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
