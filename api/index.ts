import express from "express";
import { registerRoutes } from "../server/routes";

let appPromise: Promise<express.Express> | null = null;

async function getApp(): Promise<express.Express> {
  if (!appPromise) {
    appPromise = (async () => {
      const app = express();

      // Match server/index.ts behavior for rate limiting, etc.
      app.set("trust proxy", "loopback");
      app.use(express.json());
      app.use(express.urlencoded({ extended: false }));

      await registerRoutes(app);

      return app;
    })();
  }

  return appPromise;
}

export default async function handler(req: any, res: any) {
  const app = await getApp();
  return app(req, res);
}

