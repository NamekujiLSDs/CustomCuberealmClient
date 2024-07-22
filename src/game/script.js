const { ipcRenderer } = require('electron')

ipcRenderer.on("reload", () => {
    location.reload()
})