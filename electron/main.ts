import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import log from 'electron-log'

log.initialize()
log.transports.file.level = 'debug'
log.transports.console.level = 'debug'

const logPath = path.join(app.getPath('userData'), 'logs')
console.log('Log path:', logPath)
log.info('Log path:', logPath)

let mainWindow: BrowserWindow | null = null

const isDev = process.env.NODE_ENV === 'development'

console.log('Starting application...')
console.log('Is dev mode:', isDev)
log.info('Starting application, isDev:', isDev)

function createWindow() {
  console.log('Creating window...')
  
  const preloadPath = path.join(__dirname, 'preload.js')
  console.log('Preload path:', preloadPath)
  console.log('Preload exists:', fs.existsSync(preloadPath))
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
    show: true,
    backgroundColor: '#ffffff',
    title: '合一记账',
  })
  
  console.log('BrowserWindow created')
  log.info('BrowserWindow created')

  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show')
    mainWindow?.show()
    log.info('Application started')
  })

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription)
    log.error('Failed to load:', errorCode, errorDescription)
  })
  
  mainWindow.webContents.on('page-favicon-updated', (event, favicons) => {
    console.log('Favicon updated:', favicons)
  })
  
  mainWindow.webContents.on('enter-html-full-screen', () => {
    console.log('Entered full screen')
  })

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window finished loading')
    log.info('Window finished loading')
    
    // Check DOM after a delay
    setTimeout(() => {
      mainWindow?.webContents.executeJavaScript(`
        console.log('=== DOM Check ===');
        console.log('Root innerHTML:', document.getElementById('root').innerHTML);
        console.log('Body children count:', document.body.children.length);
        console.log('All elements:', document.body.innerHTML.substring(0, 500));
      `).catch(e => console.error('Failed to execute JS:', e))
    }, 3000)
  })

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    if (level >= 2) { // error level
      log.error('Console error:', message, 'line:', line, 'source:', sourceId)
    } else {
      log.info('Console:', message)
    }
  })

  mainWindow.webContents.on('crashed', (event, killed) => {
    console.error('Renderer process crashed', killed)
    log.error('Renderer process crashed', killed)
  })
  
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('Render process gone:', details)
    log.error('Render process gone:', details)
  })

  mainWindow.webContents.on('unresponsive', () => {
    console.error('Window became unresponsive')
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
    console.log('File exists:', fs.existsSync(indexPath))
    
    // Log directory contents
    const distDir = path.join(__dirname, '../dist')
    console.log('Dist directory contents:', fs.readdirSync(distDir))
    
    mainWindow.loadFile(indexPath).then(() => {
      console.log('File loaded successfully')
      log.info('File loaded successfully')
    }).catch(e => {
      console.error('Failed to load file:', e)
      log.error('Failed to load file:', e)
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