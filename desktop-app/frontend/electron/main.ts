import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fork, ChildProcess } from 'child_process';

let mainWindow: BrowserWindow | null = null;
let backendProcess: ChildProcess | null = null;
const BACKEND_PORT = 5000;

function startBackend(): Promise<void> {
  return new Promise((resolve, reject) => {
    const backendPath = path.join(__dirname, '../../backend/dist/server.js');
    backendProcess = fork(backendPath, [], {
      cwd: path.join(__dirname, '../../backend'),
      env: {
        ...process.env,
        PORT: String(BACKEND_PORT),
        HOST: 'localhost',
      },
      silent: true,
    });

    if (backendProcess.stdout) {
      backendProcess.stdout.on('data', (data: Buffer) => {
        console.log(`[backend] ${data.toString().trim()}`);
      });
    }
    if (backendProcess.stderr) {
      backendProcess.stderr.on('data', (data: Buffer) => {
        console.error(`[backend] ${data.toString().trim()}`);
      });
    }

    backendProcess.on('error', (err) => {
      console.error('Failed to start backend:', err);
      reject(err);
    });

    // Give the backend time to start listening
    setTimeout(() => resolve(), 2000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    icon: path.join(__dirname, '../build/icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  if (!process.env.VITE_DEV_SERVER_URL && !process.env.USE_REMOTE_BACKEND) {
    try {
      await startBackend();
    } catch (err) {
      console.error('Backend failed to start:', err);
    }
  }
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (backendProcess) {
      backendProcess.kill();
    }
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
});
