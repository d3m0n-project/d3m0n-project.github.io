var emulator = document.getElementById("emulator");
var consoleOutput = document.getElementById("consoleOutput");

var time = document.getElementById("runningTime");
time.innerText = "Stopped";
var stopRequest = false; // flag to stop the emulator
var running = false; // flag to check if the emulator is running
var currentDevice = null; // current device running in the emulator

const delay = ms => new Promise(res => setTimeout(res, ms));


function statusUpdate(status, t=0) {
    // update status
    if (status === "running") {
        time.innerText = "Running time: "+t.toString()+"s";
    } else if (status === "stopped") {
        time.innerText = "Stopped";
    } else {
        time.innerText = "Unknown status: " + status;
    }
}

function log(message) {
    consoleOutput.innerHTML += "<div>" + message + "</div>";
    consoleOutput.scrollTop = consoleOutput.scrollHeight; // scroll to bottom
}


// var img = document.getElementById("scream");
// ctx.drawImage(img, 10, 10);
// ctx.fillText("Hello World", 10, 50);
// ctx.moveTo(0, 0);
// ctx.lineTo(200, 100);


//       drawRect(x, y, 100, 100, "red");
function drawRect(x, y, w, h, color) {
    var ctx = emulator.getContext("2d");
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.strokeStyle = "transparent"; // no border
    ctx.fill();
    ctx.stroke();
}
function drawLine(x1, y1, x2, y2, color) {
    var ctx = emulator.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
}
function drawText(x, y, text, color) {
    var ctx = emulator.getContext("2d");
    y+=10; // adjust y position for better visibility
    ctx.fillStyle = color;
    ctx.font = "10px Arial";
    ctx.fillText(text, x, y);
    // log("Text drawn at " + x + "," + y + ": " + text + ", color: " + color);
}
function drawImage(x, y, w, h, src) {
    return new Promise((resolve, reject) => {
        var img = new Image();
        var ctx = emulator.getContext("2d");
        img.onload = function() {
            ctx.beginPath();
            ctx.drawImage(img, x, y, w, h);
            ctx.stroke();
            resolve(); // Resolve the promise once the image is drawn
        };
        img.onerror = function() {
            console.warn("Error loading image: " + src);
            reject();
        };
        img.src = src;
    });
}
function playSound(src) {
    var audio = new Audio(src);
    audio.play().catch(function(error) {
        log("error: playing sound: " + error);
    });
}

function settingGet(name, url) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var value = xhr.responseText;
            document.getElementById(name).value = value;
        } else {
            log("error: fetching setting " + name + ": " + xhr.statusText);
        }
    };
    xhr.send();
}

function uriGetFromRoot(name) {
    return "https://raw.githubusercontent.com/d3m0n-project/d3m0n_os/refs/heads/main/rootfs/usr/share/d3m0n/"+name;
}



function getAppFile(package, name, type='layout') {
    return new Promise((resolve, reject) => {
        var url = "";
        if(package.startsWith("com.4re5.d3m0n.")) { // com.4re5.d3m0n.communication.contacts
            a = package.slice(15, package.length).split(".");
            category = a[0];
            appName = a[1];
            url = "https://raw.githubusercontent.com/d3m0n-project/d3m0n_os/refs/heads/main/rootfs/usr/share/applications/" + category +"/" + appName + "/source/"+type+"s/"+name+"."+type;
        } else {
            return "File not found";
        }
        // log("Fetching app file: " + url);
        // get the file
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                var value = xhr.responseText;
                resolve(value);
            } else if(xhr.readyState === 4) {
                reject(new Error("Error fetching file " + name + ": " + xhr.statusText));
                return "";
            }
        };
        xhr.send();
    });
}


function selectDevice() {
    var name = document.getElementById("deviceSelect").value;
    if(running) {
        if (confirm("Are you sure you want to stop the current device?")) {
            stopRequest = true; // set stop request
            running = false; // reset running flag
            currentDevice = null; // reset current device
        } else {
            return; // do not proceed if user cancels
        }
    }

    log("Booting device: " + name);
    if (name === "d3m0n c1") {
        currentDevice = new d3m0n_c1();
        stopRequest = false; // reset stop request
        running = true; // set running flag
        currentDevice.start().then(
            function(value) { 
                running=false; // reset running flag after start
                log("Device stopped successfully");
            },
            function(error) { 
                running=false; // reset running flag after start
                log("error: Error stopping device: " + error); 
            }
        );
        
    } else {
        alert("Error: Device not found");
        return;
    }
}
var mouseX = -1;
var mouseY = -1;
var clicking = false;
emulator.addEventListener("mousedown", function(event) {
    mouseX = event.clientX - emulator.offsetLeft;
    mouseY = event.clientY - emulator.offsetTop;
    clicking = true;
});

function getSetting(name, content) {
    // get setting from content
    for (let line of content.split('\n')) {
        if (line.trim().startsWith(name + ":")) {
            return line.split(":")[1].trim().replaceAll('"', '');
        }
    }
    log("error: Setting " + name + " not found");
}

async function loadPackage() {
    if(!currentDevice) { // prevent loading package if no device is selected
        return;
    }


    // Create file input
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.d3m0n'; // Accept only d3m0n packages

    input.onchange = async e => {
        var files = e.target.files;

        if (files.length !== 1 || !files[0].name.endsWith('.d3m0n')) {
            log('error: Please select a single valid d3m0n package.');
            return;
        }

        var file = files[0];
        try {
            var zip = await JSZip.loadAsync(file);
            var appName = null;
            var appIcon = null;
            var appPackage = null;
            var layouts = {};

            // Get all file entries
            var fileEntries = Object.entries(zip.files);

            // Iterate over each file entry
            for (const [relativePath, zipEntry] of fileEntries) {
                if (!zipEntry.dir) { // Check if it's a file and not a directory
                    var content = await zipEntry.async('text');
                    if (relativePath === "app") {
                        appName = getSetting("name", content);
                        appIcon = getSetting("icon", content);
                        if(appIcon.trim() === "default") {
                            appIcon = uriGetFromRoot("default.png");
                        } else {
                            appIcon = uriGetFromRoot("themes/default_dark/icons/" + appIcon + ".png");
                        }
                        appPackage = getSetting("package", content);

                        if (!appName || !appIcon || !appPackage) {
                            log('error: Invalid App Package');
                            return;
                        }
                    } else if (relativePath.startsWith("layouts/") && relativePath.endsWith('.layout')) {
                        var layoutName = relativePath.split('/')[1].replace('.layout', '');
                        layouts[layoutName] = content;
                    }
                }
            }
            if(currentDevice.apps.find(app => app.package === appPackage)) {
                console.error('App with this package already exists on the device.');
                return;
            }

            currentDevice.apps.push({
                name: appName,
                icon: appIcon,
                package: appPackage,
                layouts: layouts
            });

            // reload the desktop with the new app
            currentDevice.loadDesktop();
        } catch (error) {
            console.error('Error reading file: ' + error.message);
            alert('Error reading file');
        }
    };

    input.click();
}
class Emulator {
    constructor() {
        this.intervalId = null;
        this.width = 240; // default width
        this.height = 320; // default height
        this.time = 0.0; // running time in seconds
        this.clickZones = new Map();
        this.apps = [];
    }
    registerClick(name, X, Y, endX, endY, func) {
        this.clickZones.set(name, {pos: {x: X, y: Y, endx: endX, endy: endY}, func});
    } 
    deleteClickRegister(name) {
        if (this.clickZones[name]) {
            delete this.clickZones[name];
        } else {
            log("click zone "+name+" not found");
        }
    }
    start_timer() {
        this.intervalId = setInterval(() => {
            if (stopRequest) {
                statusUpdate("stopped");
                // stop timer
                if (this.intervalId) {
                    clearInterval(this.intervalId);
                    this.intervalId = null;
                }
                this.time = 0;
                return; // stop the timer if stopRequest is true
            }
            // click event
            if(clicking) {
                clicking = false;
                Array.from(this.clickZones.keys()).forEach(e => {
                    var element = this.clickZones.get(e);
                    if(element.pos.x < mouseX && mouseX < element.pos.endx  && element.pos.y < mouseY && mouseY < element.pos.endy) {
                        element.func(); // call func
                    }
                });
            }

            statusUpdate("running", Math.round(this.time));
            this.time += 0.1;
        }, 100);
    }
}
