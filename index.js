const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const Store = require('electron-store')
const log = require('electron-log')
const shortcut = require('electron-localshortcut')
const path = require('path')
const { autoUpdater } = require('electron-updater')

const config = new Store()

let splashWindow
let mainWindow

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

}

ipcMain.on("exitClient", () => {
    app.exit()
})
ipcMain.handle("appVersion", () => {
    return app.getVersion()
})

app.on("ready", () => {
    createSplash()
})