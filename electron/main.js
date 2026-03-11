const { app, BrowserWindow, shell, ipcMain } = require("electron");
const { spawn } = require("child_process");
const { resolve } = require("path");
const { readdir, readFile } = require("fs/promises");
const http = require("http");

const projectRoot = resolve(__dirname, "..");
const outputDir = resolve(projectRoot, "output");
let studioProcess = null;
let studioPort = null;
let mainWindow = null;

// --- IPC: scan output/ for compositions ---

ipcMain.handle("get-compositions", async () => {
  const compositions = [];
  try {
    const dirs = (await readdir(outputDir)).sort();
    for (const dir of dirs) {
      try {
        const raw = await readFile(resolve(outputDir, dir, "clip.json"), "utf-8");
        const data = JSON.parse(raw);
        compositions.push({
          id: dir,
          hookTitle: data.hookTitle || { ja: dir, en: dir },
          duration: data.clip
            ? (data.clip.endTime - data.clip.startTime).toFixed(1)
            : null,
          subtitleCount: data.subtitles?.length || 0,
          vocabCount: data.vocabCards?.length || 0,
        });
      } catch {}
    }
  } catch {}
  return compositions;
});

ipcMain.handle("open-composition", async (_event, compId) => {
  if (!studioPort) {
    // Start the studio if not already running
    studioPort = await startStudio();
    await waitForServer(studioPort, 30);
  }

  mainWindow.loadURL(`http://localhost:${studioPort}/app#${encodeURIComponent(compId)}`);

  mainWindow.webContents.on("did-finish-load", function injectPadding() {
    mainWindow.webContents.insertCSS(`
      body { padding-top: 38px; box-sizing: border-box; }
      .container { height: calc(100vh - 38px) !important; }
    `);
    mainWindow.webContents.removeListener("did-finish-load", injectPadding);
  });
});

ipcMain.handle("go-back-to-projects", () => {
  mainWindow.loadFile(resolve(__dirname, "project.html"));
});

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
  return new Promise((resolve, reject) => {
    studioProcess = spawn("bun", ["studio-wrapper/launch.ts"], {
      cwd: projectRoot,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, ELECTRON_NO_OPEN: "1" },
    });

    let wrapperPort = null;
    let resolved = false;

    studioProcess.stdout.on("data", (data) => {
      const text = data.toString();
      process.stdout.write(text);

      const portMatch = text.match(/localhost:(\d+)/);
      if (portMatch && !wrapperPort) {
        wrapperPort = parseInt(portMatch[1]);
      }

      if (
        !resolved &&
        (text.includes("Opening browser") ||
          text.includes("Studio wrapper running"))
      ) {
        if (wrapperPort) {
          resolved = true;
          resolve(wrapperPort);
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

// --- Window ---

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "FluencyKaizen Studio",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: resolve(__dirname, "preload.js"),
    },
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 12, y: 12 },
  });

  // Start on the project page
  mainWindow.loadFile(resolve(__dirname, "project.html"));

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
