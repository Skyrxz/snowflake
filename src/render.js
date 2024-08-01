const { mouse } = require("@kirillvakalov/nut-tree__nut-js");
const gkm = require("gkm");
const { ipcRenderer } = require('electron');

const elements = {
    toggle: document.getElementById("toggle"),
    chance: document.getElementById("chance"),
    chanceLabel: document.getElementById("chance_label"),
    delay: document.getElementById("delay"),
    delayLabel: document.getElementById("delay_label"),
    activationCPS: document.getElementById("activation_cps"),
    activationCPSLabel: document.getElementById("activation_cps_label"),
    cpsInput: document.getElementById("cps_input"),
    cpsOutput: document.getElementById("cps_output")
};

// Handle close button click
document.addEventListener('DOMContentLoaded', () => {
    const closeButton = document.getElementById('close');
    closeButton.addEventListener('click', () => {
        ipcRenderer.send('window-close'); // Send a message to main process
    });

    const minimizeButton = document.getElementById('minimize')
    minimizeButton.addEventListener('click', () => {
        ipcRenderer.send('window-minimize'); // Send a message to main process
    });
});

mouse.config.autoDelayMs = 0;

function getRandomInteger(maximum, minimum) {
    return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

function probability(n) {
    const p = n/100
    return !!p && Math.random() <= p;
};

document.addEventListener("mousemove", e => {
    switch (e.target) {
        case elements.chance:
            elements.chanceLabel.innerText = `${elements.chance.value}%`;
            break;
        case elements.delay:
            elements.delayLabel.innerText = `${elements.delay.value} ms`;
            break;
        case elements.activationCPS:
            elements.activationCPSLabel.innerText = `${elements.activationCPS.value} CPS`;
            break;
    }
});

let clickTimestamps = [];
let ignoreLeftClick = 0;
let ignoreRightClick = 0;
const CPS_INTERVAL = 1000; // 1 second
const clickQueue = [];

function calculateCPS() {
    const currentTime = Date.now();
    clickTimestamps = clickTimestamps.filter(timestamp => currentTime - timestamp <= CPS_INTERVAL);
    const cps = clickTimestamps.length;
    elements.cpsInput.innerText = `${cps}`;
    elements.cpsOutput.innerText = `${cps}`;
}

function handleMouseReleased(e) {
    const currentTime = Date.now();
    clickTimestamps.push(currentTime);
    calculateCPS();
    const activationCPS = parseInt(elements.activationCPS.value, 10);
    const clickEnable = elements.toggle.checked;
    const cps = clickTimestamps.length;

    if(!probability(parseInt(elements.chance.value, 10))) {
        return
    }

    if (e[0] == "1") {
        if (ignoreLeftClick > 0) {
            ignoreLeftClick--;
            return;
        }
    
        if (clickEnable && cps >= activationCPS) {
            clickQueue.push({ type: "leftClick" });
            processClickQueue();
        }
    } else if (e[0] == "2") {
        if (ignoreRightClick > 0) {
            ignoreRightClick--;
            return;
        }
    
        if (clickEnable && cps >= activationCPS) {
            clickQueue.push({ type: "rightClick" });
            processClickQueue();
        }
    }
}

function processClickQueue() {
    if (clickQueue.length === 0) {
        return;
    }
    const delay = parseInt(elements.delay.value, 10) + getRandomInteger(20, 15)

    const clickTask = clickQueue.shift();
    setTimeout(() => {
        if (clickTask.type === "leftClick") {
            ignoreLeftClick++;
            mouse.leftClick();
        } else if (clickTask.type === "rightClick") {
            ignoreRightClick++;
            mouse.rightClick();   
        }
    }, delay)

    if (clickQueue.length > 0) {
        setTimeout(processClickQueue, 4);
    }
}

function updateCPS() {
    calculateCPS();
    requestAnimationFrame(updateCPS);
}

gkm.events.on("mouse.released", handleMouseReleased);

// Start the CPS update loop
updateCPS();

// Clear old click timestamps periodically to prevent memory leaks
setInterval(() => {
    const currentTime = Date.now();
    clickTimestamps = clickTimestamps.filter(timestamp => currentTime - timestamp <= CPS_INTERVAL);
}, CPS_INTERVAL);