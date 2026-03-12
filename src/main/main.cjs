const { app, BrowserWindow, shell, ipcMain, dialog } = require("electron");
const { spawn } = require("child_process");
const { resolve, basename, extname } = require("path");
const { readFile, copyFile, mkdir } = require("fs/promises");
const { createReadStream, statSync } = require("fs");
const http = require("http");

const projectRoot = resolve(__dirname, "..", "..");
const outputDir = resolve(projectRoot, "output");
let studioProcess = null;
let studioPort = null;
let mainWindow = null;

// --- Server readiness check ---

function waitForServer(port, maxAttempts = 120) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      const req = http.get(`http://localhost:${port}`, (res) => {
        resolve(port);
      });
      req.on("error", () => {
        if (attempts >= maxAttempts) {
          reject(new Error(`Server not ready after ${maxAttempts} attempts`));
        } else {
          setTimeout(check, 1000);
        }
      });
      req.setTimeout(2000, () => {
        req.destroy();
        if (attempts < maxAttempts) setTimeout(check, 500);
      });
    };
    check();
  });
}

// --- Studio launcher ---

function startStudio() {
  return new Promise((resolvePromise, reject) => {
    // Use bun to run the Studio launcher
    studioProcess = spawn("bun", ["src/studio/launch.ts"], {
      cwd: projectRoot,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, ELECTRON_NO_OPEN: "1" },
    });

    let wrapperPort = null;
    let resolved = false;

    studioProcess.stdout.on("data", (data) => {
      const text = data.toString();
      process.stdout.write(text);

      if (
        !resolved &&
        (text.includes("Studio server running at") ||
          text.includes("Studio wrapper running at") ||
          text.includes("Studio ready at"))
      ) {
        // Extract port specifically from this line
        const portMatch = text.match(/localhost:(\d+)/);
        if (portMatch) {
          wrapperPort = parseInt(portMatch[1]);
          resolved = true;
          resolvePromise(wrapperPort);
        }
      }
    });

    studioProcess.stderr.on("data", (data) => {
      process.stderr.write(data.toString());
    });

    studioProcess.on("error", (err) => {
      if (!resolved) reject(err);
    });
    studioProcess.on("exit", (code) => {
      if (!resolved) {
        reject(new Error(`Studio process exited with code ${code}`));
      }
    });
  });
}

// --- IPC: import video via native file dialog ---

let pipelineInFlight = false;

ipcMain.handle("import-video", async (_event, lang) => {
  if (pipelineInFlight) {
    return { error: "A pipeline is already running" };
  }

  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Import Video",
    filters: [
      { name: "Video Files", extensions: ["mp4", "mov", "avi", "mkv", "webm"] },
    ],
    properties: ["openFile"],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true };
  }

  const videoPath = result.filePaths[0];
  const fileName = basename(videoPath);

  if (!studioPort) {
    return { error: "Studio server is not running" };
  }

  // Upload the file to the Studio server via multipart form POST
  pipelineInFlight = true;
  try {
    const fileStats = statSync(videoPath);
    const targetLang = lang || "ja";

    const result = await new Promise((resolvePromise, rejectPromise) => {
      const boundary = `----FormBoundary${Date.now()}`;
      const langField = `--${boundary}\r\nContent-Disposition: form-data; name="lang"\r\n\r\n${targetLang}\r\n`;
      const fileHeader = `--${boundary}\r\nContent-Disposition: form-data; name="video"; filename="${fileName}"\r\nContent-Type: video/mp4\r\n\r\n`;
      const fileTail = `\r\n--${boundary}--\r\n`;

      const langFieldBuf = Buffer.from(langField);
      const fileHeaderBuf = Buffer.from(fileHeader);
      const fileTailBuf = Buffer.from(fileTail);

      const contentLength = langFieldBuf.length + fileHeaderBuf.length + fileStats.size + fileTailBuf.length;

      const options = {
        hostname: "localhost",
        port: studioPort,
        path: "/api/import-video",
        method: "POST",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          "Content-Length": contentLength,
        },
      };

      const req = http.request(options, (res) => {
        let body = "";
        res.on("data", (chunk) => { body += chunk; });
        res.on("end", () => {
          try {
            resolvePromise(JSON.parse(body));
          } catch {
            resolvePromise({ status: "started" });
          }
        });
      });

      req.on("error", (err) => {
        rejectPromise(err);
      });

      // Write the multipart body
      req.write(langFieldBuf);
      req.write(fileHeaderBuf);

      const fileStream = createReadStream(videoPath);
      fileStream.on("data", (chunk) => req.write(chunk));
      fileStream.on("end", () => {
        req.write(fileTailBuf);
        req.end();
      });
      fileStream.on("error", (err) => {
        req.destroy();
        rejectPromise(err);
      });
    });

    pipelineInFlight = false;
    return { success: true, fileName };
  } catch (err) {
    pipelineInFlight = false;
    return { error: err.message };
  }
});

ipcMain.handle("go-back-to-projects", () => {
  if (studioPort) {
    mainWindow.loadURL(`http://localhost:${studioPort}/`);
  }
});

// --- Window ---

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "FluencyKaizen Studio",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: resolve(__dirname, "preload.cjs"),
    },
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 12, y: 12 },
  });

  // Start the Studio server
  try {
    console.log("Starting FluencyKaizen Studio server...");
    studioPort = await startStudio();
    console.log(`Studio server ready on port ${studioPort}`);

    // Wait for the server to be fully responsive
    await waitForServer(studioPort, 30);

    // Load the Studio server's project page
    mainWindow.loadURL(`http://localhost:${studioPort}/`);
  } catch (err) {
    console.error("Failed to start studio server:", err);
    // Load a fallback error page
    mainWindow.loadURL(
      `data:text/html,<html><body style="background:#0a0a0a;color:#e0e0e0;font-family:system-ui;padding:48px;">
        <h1>Failed to start FluencyKaizen Studio</h1>
        <p style="color:#f87171">${err.message}</p>
        <p style="color:#666;margin-top:16px">Make sure <code>bun</code> is installed and run <code>bun install</code> from the project root.</p>
      </body></html>`
    );
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// --- App lifecycle ---

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (studioProcess) studioProcess.kill("SIGTERM");
  app.quit();
});

app.on("before-quit", () => {
  if (studioProcess) studioProcess.kill("SIGTERM");
});
