import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFile, writeFile, readdir } from "fs/promises";
import { resolve } from "path";
import type { ViteDevServer } from "vite";

const projectRoot = resolve(__dirname, "..", "..");
const outputDir = resolve(projectRoot, "output");

/** Vite plugin that adds REST API routes for reading/writing clip data */
function clipApiPlugin() {
  return {
    name: "clip-api",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url ?? "/";
        const [pathname] = rawUrl.split("?");

        // GET /api/clips — list all clips with metadata
        if (req.method === "GET" && pathname === "/api/clips") {
          try {
            const dirs = (await readdir(outputDir)).sort();
            const clips: unknown[] = [];
            for (const dir of dirs) {
              try {
                const raw = await readFile(
                  resolve(outputDir, dir, "clip.json"),
                  "utf-8"
                );
                const data = JSON.parse(raw);
                clips.push({
                  id: dir,
                  hookTitle: data.hookTitle ?? { ja: dir, en: dir },
                  duration: data.clip
                    ? (data.clip.endTime - data.clip.startTime).toFixed(1)
                    : null,
                  subtitleCount: data.subtitles?.length ?? 0,
                  vocabCount: data.vocabCards?.length ?? 0,
                });
              } catch {}
            }
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(clips));
          } catch {
            res.end("[]");
          }
          return;
        }

        // GET /api/clip/:id — read clip.json
        const clipMatch = pathname.match(/^\/api\/clip\/(.+)$/);
        if (clipMatch) {
          const id = decodeURIComponent(clipMatch[1]);

          if (req.method === "GET") {
            try {
              const raw = await readFile(
                resolve(outputDir, id, "clip.json"),
                "utf-8"
              );
              res.setHeader("Content-Type", "application/json");
              res.end(raw);
            } catch {
              res.statusCode = 404;
              res.end("Not found");
            }
            return;
          }

          // PUT /api/clip/:id — write clip.json
          if (req.method === "PUT") {
            const chunks: Buffer[] = [];
            req.on("data", (chunk: Buffer) => chunks.push(chunk));
            req.on("end", async () => {
              const body = Buffer.concat(chunks).toString("utf-8");
              try {
                JSON.parse(body); // validate JSON
                await writeFile(resolve(outputDir, id, "clip.json"), body);
                res.setHeader("Content-Type", "application/json");
                res.end('{"ok":true}');
              } catch (e: unknown) {
                res.statusCode = 400;
                res.end(e instanceof Error ? e.message : "Invalid JSON");
              }
            });
            return;
          }
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), clipApiPlugin()],
  // src/remotion/public/ already has video files copied by launch.ts
  publicDir: "public",
  root: __dirname,
  build: {
    rollupOptions: {
      input: "editor.html",
    },
    outDir: "dist-editor",
  },
  server: {
    port: 5173,
    open: "/editor.html",
  },
  resolve: {
    alias: {
      "@pipeline": resolve(projectRoot, "src/pipeline"),
      "@style": resolve(projectRoot, "style.json"),
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "@remotion/player", "remotion"],
  },
});
