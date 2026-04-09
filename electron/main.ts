import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import log from 'electron-log'

log.initialize()
log.transports.file.level = 'info'
log.transports.console.level = 'debug'

let mainWindow: BrowserWindow | null = null

const isDev = process.env.NODE_ENV === 'development'

console.log('Starting application...')
console.log('Is dev mode:', isDev)

function createWindow() {
  console.log('Creating window...')
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    title: '合一记账',
  })

  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show')
    mainWindow?.show()
    log.info('Application started')
  })

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription)
  })

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window finished loading')
  })

  if (isDev) {
    console.log('Loading dev URL: http://localhost:5173')
    mainWindow.loadURL('http://localhost:5173').catch(e => {
      console.error('Failed to load URL:', e)
    })
    mainWindow.webContents.openDevTools()
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html')
    console.log('Loading production file:', indexPath)
    mainWindow.loadFile(indexPath).catch(e => {
      console.error('Failed to load file:', e)
    })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('dialog:openFile', async (_, options) => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: options?.filters || [
      { name: 'All Files', extensions: ['*'] },
    ],
  })
  return result
})

ipcMain.handle('dialog:saveFile', async (_, options) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    filters: options?.filters || [],
    defaultPath: options?.defaultPath,
  })
  return result
})

log.info('Main process initialized')