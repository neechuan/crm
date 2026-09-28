import type { Plugin, ViteDevServer, PreviewServer } from 'vite';
import { CrmDatabase } from './src/server/db.ts';
import { seedDatabase } from './src/server/seed.ts';
import { handleApiRequest } from './src/server/api.ts';

export function crmApiPlugin(): Plugin {
  let db: CrmDatabase;

  const initDb = () => {
    if (!db) {
      db = new CrmDatabase();
      if (db.isEmpty()) {
        console.log('[CRM] Database is empty. Seeding initial realistic sample data...');
        seedDatabase(db);
        console.log('[CRM] Seed completed successfully.');
      } else {
        console.log('[CRM] Database loaded with existing data.');
      }
    }
    return db;
  };

  return {
    name: 'vite-plugin-crm-api',
    configureServer(server: ViteDevServer) {
      const database = initDb();
      server.middlewares.use(async (req, res, next) => {
        try {
          const handled = await handleApiRequest(req, res, database);
          if (!handled) {
            next();
          }
        } catch (err) {
          console.error('[CRM API Error]', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Internal Server Error' }));
        }
      });
    },
    configurePreviewServer(server: PreviewServer) {
      const database = initDb();
      server.middlewares.use(async (req, res, next) => {
        try {
          const handled = await handleApiRequest(req, res, database);
          if (!handled) {
            next();
          }
        } catch (err) {
          console.error('[CRM API Error]', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Internal Server Error' }));
        }
      });
    }
  };
}
