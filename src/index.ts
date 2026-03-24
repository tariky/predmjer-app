import { serve } from "bun";
import index from "./index.html";
import db from "../server/db/index";
import { createAuthRoutes } from "../server/routes/auth";
import { createAdminRoutes } from "../server/routes/admin";
import { createLibraryRoutes } from "../server/routes/library";
import { createEstimateRoutes } from "../server/routes/estimates";
import { createExportRoutes } from "../server/routes/export";
import { createAiRoutes } from "../server/routes/ai";
import { createCalculationRoutes } from "../server/routes/calculations";

const authRoutes = createAuthRoutes(db);
const adminRoutes = createAdminRoutes(db);
const libraryRoutes = createLibraryRoutes(db);
const estimateRoutes = createEstimateRoutes(db);
const exportRoutes = createExportRoutes(db);
const aiRoutes = createAiRoutes(db);
const calcRoutes = createCalculationRoutes(db);

const server = serve({
  port: parseInt(process.env.PORT || "3000"),
  routes: {
    ...authRoutes,
    ...adminRoutes,
    ...libraryRoutes,
    ...estimateRoutes,
    ...exportRoutes,
    ...aiRoutes,
    ...calcRoutes,

    // Serve uploaded files
    "/uploads/*": async (req) => {
      const path = `./data${new URL(req.url).pathname}`;
      const file = Bun.file(path);
      if (await file.exists()) {
        return new Response(file);
      }
      return new Response("Not found", { status: 404 });
    },

    // SPA fallback — must be last
    "/*": index,
  },
  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`Server running at ${server.url}`);
