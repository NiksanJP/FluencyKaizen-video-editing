const { app, BrowserWindow, shell, ipcMain, dialog } = require("electron");
const { spawn } = require("child_process");
const { resolve, basename, extname } = require("path");
const { readdir, readFile, copyFile, mkdir } = require("fs/promises");
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
          targetLanguage: data.targetLanguage || "ja",
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

  const remotionCompId = String(compId).replace(/[^a-zA-Z0-9\-\u3000-\u9FFF]/g, "-");
  mainWindow.loadURL(`http://localhost:${studioPort}/${encodeURIComponent(remotionCompId)}`);
});

ipcMain.handle("go-back-to-projects", () => {
  mainWindow.loadFile(resolve(__dirname, "project.html"));
});

// --- IPC: import video and run pipeline ---

let pipelineProcess = null;

ipcMain.handle("import-video", async (_event, lang) => {
  if (pipelineProcess) {
    return { error: "A pipeline is already running" };
  }

  const send = (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("pipeline-progress", data);
    }
  };

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
  const inputDir = resolve(projectRoot, "input");

  // Show progress immediately
  send({ type: "start", fileName });
  send({ type: "step", step: "copy", message: "Copying video file…" });

  // Copy video to input/ directory
  await mkdir(inputDir, { recursive: true });
  const destPath = resolve(inputDir, fileName);
  await copyFile(videoPath, destPath);

  send({ type: "step", step: "pipeline", message: "Starting pipeline…" });

  return new Promise((resolvePromise) => {
    const targetLang = lang || "ja";
    pipelineProcess = spawn("bun", ["pipeline/index.ts", destPath, "--lang", targetLang], {
      cwd: projectRoot,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env },
    });

    // Detect pipeline steps from stdout markers
    const detectStep = (text) => {
      if (text.includes("Converting MOV")) {
        send({ type: "step", step: "convert", message: "Converting video format…" });
      } else if (text.includes("Transcribing") || text.includes("whisper") || text.includes("Step 1") || text.includes("audio extraction")) {
        send({ type: "step", step: "transcribe", message: "Transcribing audio…" });
      } else if (text.includes("cached transcription")) {
        send({ type: "step", step: "transcribe", message: "Using cached transcription" });
      } else if (text.includes("Gemini") || text.includes("Analyzing") || text.includes("Step 3")) {
        send({ type: "step", step: "analyze", message: "Analyzing with AI…" });
      } else if (text.includes("cached analysis")) {
        send({ type: "step", step: "analyze", message: "Using cached analysis" });
      } else if (text.includes("silence") || text.includes("Step 4") || text.includes("✂️")) {
        send({ type: "step", step: "silence", message: "Removing silence gaps…" });
      } else if (text.includes("Saved") || text.includes("💾")) {
        send({ type: "step", step: "save", message: "Saving clip data…" });
      } else if (text.includes("Generating") || text.includes("TSX") || text.includes("Step 6")) {
        send({ type: "step", step: "generate", message: "Generating composition…" });
      } else if (text.includes("Pipeline complete") || text.includes("✨")) {
        send({ type: "step", step: "complete", message: "Pipeline complete!" });
      }
    };

    pipelineProcess.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      process.stdout.write(text);
      send({ type: "log", text });
      detectStep(text);
    });

    pipelineProcess.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      process.stderr.write(text);
      send({ type: "log", text });
    });

    pipelineProcess.on("close", (code) => {
      pipelineProcess = null;
      // Derive composition ID (pipeline uses filename without extension as output dir name)
      const compId = fileName.replace(/\.[^.]+$/, "");
      if (code === 0) {
        send({ type: "done", fileName, compId });
        resolvePromise({ success: true, fileName, compId });
      } else {
        send({ type: "error", message: `Pipeline exited with code ${code}` });
        resolvePromise({ error: `Pipeline exited with code ${code}` });
      }
    });

    pipelineProcess.on("error", (err) => {
      pipelineProcess = null;
      send({ type: "error", message: err.message });
      resolvePromise({ error: err.message });
    });
  });
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
          text.includes("Studio ready at"))
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
