const { app, BrowserWindow, protocol, Menu, ipcMain } = require('electron')
const Store = require('electron-store')
const log = require('electron-log')
const shortcut = require('electron-localshortcut')
const path = require('path')
const { autoUpdater } = require('electron-updater')
const config = new Store()

let splashWindow
let mainWindow

Object.defineProperty(app, 'isPackaged', {
    get() {
        return true
    }
})

//カスタムプロトコルの登録
app.on('ready', () => {
    protocol.registerFileProtocol('c3', (request, callback) =>
        callback(decodeURI(request.url.replace(/^c3:\//, '')))
    )
})
protocol.registerSchemesAsPrivileged([
    {
        scheme: 'c3',
        privileges: {
            secure: true,
            corsEnabled: true
        }
    }
])
//スプラッシュウィンドウを作成する
const createSplash = () => {
    splashWindow = new BrowserWindow({
        height: 400,
        width: 600,
        resizable: false,
        alwaysOnTop: true,
        transparent: true,
        frame: false,
        show: false,
        icon: "./icon.ico",
        webPreferences: {
            preload: path.join(__dirname, './src/splash/script.js')
        }
    })
    splashWindow.loadFile(path.join(__dirname, './src/splash/index.html'))
    const update = async () => {
        let updateCheck = null
        autoUpdater.on('checking-for-update', () => {
            splashWindow.webContents.send('status', 'Checking for updates...')
            updateCheck = setTimeout(() => {
                splashWindow.webContents.send('status', 'Update check error!')
                setTimeout(() => {
                    createMain()
                }, 1000)
            }, 15000)
        })
        autoUpdater.on('update-available', i => {
            if (updateCheck) clearTimeout(updateCheck)
            splashWindow.webContents.send(
                'status',
                `Found new version v${i.version}!`
            )
        })
        autoUpdater.on('update-not-available', () => {
            if (updateCheck) clearTimeout(updateCheck)
            splashWindow.webContents.send(
                'status',
                'You are using the latest version!'
            )
            setTimeout(() => {
                createMain()
            }, 1000)
        })
        autoUpdater.on('error', e => {
            if (updateCheck) clearTimeout(updateCheck)
            splashWindow.webContents.send('status', 'Error!' + e.name)
            setTimeout(() => {
                createMain()
            }, 1000)
        })
        autoUpdater.on('download-progress', i => {
            if (updateCheck) clearTimeout(updateCheck)
            splashWindow.webContents.send('status', 'Downloading new version...')
        })
        autoUpdater.on('update-downloaded', i => {
            if (updateCheck) clearTimeout(updateCheck)
            splashWindow.webContents.send('status', 'Update downloaded')
            setTimeout(() => {
                autoUpdater.quitAndInstall()
            }, 1000)
        })
        autoUpdater.autoDownload = 'download'
        autoUpdater.allowPrerelease = false
        autoUpdater.checkForUpdates()
    }
    splashWindow.webContents.on('did-finish-load', () => {
        splashWindow.show()
        update()
    })
}

const createMain = () => {
    mainWindow = new BrowserWindow({
        height: config.get("windowHeight", 1080),
        width: config.get("windowWidth", 1920),
        fullscreen: config.get("fullscreen", true),
        show: false,
        icon: "./icon.ico",
        webPreferences: {
            preload: path.join(__dirname, "./src/game/script.js"),
            contextIsolation: true,
            nodeIntegration: false,
        }
    })
    mainWindow.loadURL("https://cuberealm.io/")
    mainWindow.webContents.on('will-prevent-unload', e => {
        e.preventDefault()
    })
    mainWindow.on('ready-to-show', () => {
        splashWindow.destroy()
        mainWindow.show()
    })
    shortcut.register(mainWindow, "F5", () => {
        mainWindow.webContents.send("reload")
    })
    shortcut.register(mainWindow, 'F11', () => {
        const isFullScreen = mainWindow.isFullScreen()
        config.set('Fullscreen', !isFullScreen)
        mainWindow.setFullScreen(!isFullScreen)
    })
    shortcut.register(mainWindow, "F12", () => {
        mainWindow.webContents.openDevTools()
    })
    mainWindow.on('close', () => {
        if (!mainWindow.isDestroyed()) {
            //座標などを保存する
            const { x, y, width, height } = mainWindow.getBounds()
            config.set({ x, y, width, height })
            config.set("fullscreen", mainWindow.isFullScreen())
            config.set("maximize", mainWindow.isMaximized())
            mainWindow.destroy()
        } try { settingWindow.close() } catch (e) { }
    });
    Menu.setApplicationMenu(null)
}

//親の顔もっと見ろ
const initFlags = () => {
    const flaglist = [
        ['disable-frame-rate-limit', null, config.get('unlimitedFps', true)],
        ['use-angle', config.get('angleType', 'default'), true],
    ]
    flaglist.forEach(f => {
        const isEnable = f[2] ? 'Enable' : 'Disable'
        if (f[2]) {
            if (f[1] === null) {
                app.commandLine.appendSwitch(f[0])
            } else {
                app.commandLine.appendSwitch(f[0], f[1])
            }
        }
    })
    app.commandLine.appendSwitch("disable-gpu-vsync")
    app.commandLine.appendSwitch("in-process-gpu")
    app.commandLine.appendSwitch("enable-quic")
    app.commandLine.appendSwitch("enable-gpu-rasterization")
    app.commandLine.appendSwitch("enable-pointer-lock-options")
    app.commandLine.appendSwitch("enable-heavy-ad-intervention")
}
initFlags()

ipcMain.on("exitClient", () => {
    app.exit()
})
ipcMain.handle("appVersion", () => {
    return app.getVersion()
})

app.on("ready", () => {
    createSplash()
})