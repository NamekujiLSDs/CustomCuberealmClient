const { ipcRenderer, contextBridge } = require('electron')

contextBridge.exposeInMainWorld('c3', {
    close: () => { ipcRenderer.send("exitClient") }
})

document.addEventListener("DOMContentLoaded", async () => {
    ipcRenderer.on("status", (e, v) => {
        document.getElementById("updateStats").innerText = v
    })
    let ver = await ipcRenderer.invoke("appVersion")
    document.getElementById("appVersion").innerText = `v ` + ver
})