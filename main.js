const { app, BrowserWindow, systemPreferences, desktopCapturer, session, ipcMain } = require('electron');
const path = require('path');

// Disable sandbox to fix Linux SUID permission crashes
app.commandLine.appendSwitch('no-sandbox');
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    frame: false,
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.removeMenu();

  // Load the index.html of the app.
  mainWindow.loadFile('index.html');
  
  // Expose window maximize state and handle IPC toggle
  const sendMaximizeState = () => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-maximized-state', mainWindow.isMaximized());
    }
  };

  mainWindow.on('maximize', sendMaximizeState);
  mainWindow.on('unmaximize', sendMaximizeState);
  mainWindow.on('resize', sendMaximizeState);

  ipcMain.on('window-controls-toggle-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on('window-controls-minimize', () => {
    mainWindow.minimize();
  });

  ipcMain.on('window-controls-close', () => {
    mainWindow.close();
  });

  ipcMain.on('get-window-maximized-state', (event) => {
    event.returnValue = mainWindow.isMaximized();
  });

  // Ask for microphone permissions if needed (mostly for macOS, but good practice)
  if (process.platform === 'darwin') {
    systemPreferences.askForMediaAccess('microphone').then(success => {
      console.log('Microphone access:', success);
    });
  }
}

app.whenReady().then(() => {
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
      // Grant access to the first screen found with loopback audio
      callback({ video: sources[0], audio: 'loopback' });
    }).catch((err) => {
      console.error('Error getting sources:', err);
      callback();
    });
  });

  // Automatically grant media permissions to avoid blocking or empty device labels
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true);
    } else {
      callback(false);
    }
  });

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
