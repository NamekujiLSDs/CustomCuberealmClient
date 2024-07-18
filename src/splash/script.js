const { ipcRenderer, contextBridge } = require('electron')

contextBridge.exposeInMainWorld('c3', {
    close: () => { ipcRenderer.send("exitClient") }
})

document.addEventListener("DOMContentLoaded", () => {
    ipcRenderer.on("send", (v) => {
        console.log(v)
        document.getElementById("updateStats").innerText = v
    })
    ipcRenderer.invoke("appVersion", (v) => {
        document.getElementById("appVersion").innerText = v
    })
})