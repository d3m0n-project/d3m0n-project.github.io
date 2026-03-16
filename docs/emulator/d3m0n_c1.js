class d3m0n_c1 extends Emulator {
    constructor() {
        super();
        this.name = "d3m0n_c1";
        this.width = 240;
        this.height = 320;
        this.description = "A simple emulator for d3m0n c1 phones";
        this.version = "1.0.0";
        this.author = "4re5 group";
        

        // app settings
        this.slot_x, this.slot_y = 0;
        this.app_padding = 10;
        this.appPerRow = 2;
        this.appPerColumn = 4;
        this.icon_size = this.width/this.appPerRow-20;
        

        this.apps = [
            { name: "Contacts", icon: uriGetFromRoot("/themes/default_dark/icons/contacts.png"), package: "com.4re5.d3m0n.communication.contacts", 
              layouts: {}
            },
            {
                name: "Color Test", icon: uriGetFromRoot("default.png"), package: "com.4re5.d3m0n.testing.color",
                layouts: {}
            }
        ];
        this.loadMainLayout();
    }
    async d3m0nLayoutLoad(file) {
        if(file && file.startsWith("# d3m0n layout")) {
            file = file.replaceAll(";\r\n", ";").replaceAll(":\r\n", ":");
            
            for(var line of file.split('\n')) {
                if(line.trim() === "" || line.trim().startsWith("#")) continue;
                // get properties
                else if(line.trim().includes(":") && line.trim().includes(";")) {
                    let tmp = line.trim().split(":");
                    let control = tmp[0];
                    let properties = tmp[1].split(";");

                    if(control.trim() === "") continue; // pass parsing errors

                    switch(control.trim()) {
                        case "Window":
                            var win = new Window();
                            await win.applyProperties(properties);
                            await win.draw();
                            break;
                        case "Text":
                            var elem = new Text();
                            await elem.applyProperties(properties);
                            await elem.draw();
                            break;
                        case "Rect":
                            var elem = new Rect();
                            await elem.applyProperties(properties);
                            await elem.draw();
                            break;
                        default:
                            log("CONTROL NOT FOUND! : "+control);
                            break;
                        // add more later
                    }
                }

            }
            let x1=this.width-10;
            let x2=this.width-20;
            await drawLine(x1, 10, x2, 20, "magenta");
            await drawLine(x2, 10, x1, 20, "magenta");
            await this.registerClick("exitKey", x2, 10, x1, 20, this.loadDesktop.bind(this)); // register click for exit key

            // clock
            let d = new Date();
            await drawText(10, 10, d.getHours()+":"+d.getMinutes(), "magenta");
        } else {
            log("error: invalid layout file: " + file);
            return;
        }
    }
    async loadMainLayout() {
        for (let app of this.apps) {
            // log("Fetching app: " + app.name);
            
            await getAppFile(app.package, "main").then(
                function(value) {
                    app.layouts["main"] = value;
                },
                function(error) {
                    // not found text layout
                    app.layouts.main = "# d3m0n layout\n\nWindow:\n	width=\"100%\";\n	height=\"100%\";\n	name=\"Not Found\";\n	bg_color=\"white\";\n	topbar=\"true\";\n\nText:\n	location=\"20, 20\";\n	content=\"Error: App could not be fetched!\";\n	color=\"red\";\n	bg_color=\"yellow\";";
                    log("error: loading app layout: " + error);
                }
            );
        }
    }
    

    async launchApp(name) {
        await drawRect(0, 0, this.width, this.height, "black");
        await this.d3m0nLayoutLoad(this.apps.find(app => app.name == name).layouts.main, "main");
    }

    async drawApp(slot_x, slot_y, name, pkg, icon) 
    {
        var appRect_x = slot_x * (this.icon_size + this.app_padding) + 20;
        var appRect_y = slot_y * (this.icon_size + this.app_padding);

        await drawImage(appRect_x + 10, appRect_y + 10, this.icon_size - 20, this.icon_size - 20, icon);

        // Position text below the icon
        var textX = appRect_x + 10 + (name.length * 5)/2;
        var textY = appRect_y + this.icon_size; // Adjust Y position to be below the icon

        await drawText(textX, textY, name, "white");

        // Register click zone
        this.registerClick("icon_" + pkg, appRect_x + 10, appRect_y + 10, appRect_x + this.icon_size - 10, appRect_y + this.icon_size - 10, this.launchApp.bind(this, name));
    }

    async loadDesktop() {
        this.clickZones.clear();

        // clear the app list
        var appList = document.getElementById("appsList");
        appList.innerHTML = ""; // clear the app list

        // Draw wallpaper image
        await drawImage(0, 0, this.width, this.height, uriGetFromRoot("wallpapers/default.bmp"));

        var slot_x = 0;
        var slot_y = 0;

        // Draw apps
        for (let app of this.apps) {
            // log("Drawing app: " + app.name);
            try {
                await this.drawApp(slot_x, slot_y, app.name, app.package, app.icon);
            }
            catch (error) {
                log("error: drawing app: " + app.name);
            }
            
            
            slot_x++;
            if (slot_x >= this.appPerRow) {
                slot_x = 0;
                slot_y++;
            }
            
            appList.innerHTML += `<div style="align-items: center; gap: 10px; display: flex;"><img src="${app.icon}" style="width:35px; height 35px;">${app.name}</div>`;
        
        }
    }

    async start() 
    {
        emulator.width = this.width;
        emulator.height = this.height;
        await drawRect(0, 0, this.width, this.height, "black");

        this.start_timer();

        // Draw splash image first
        await drawImage(0, 0, this.width, this.height, uriGetFromRoot("src/splash/splash.png"));

        // Draw text on top of the splash image
        await drawText(0, 0, "booting...", "red");

        playSound(uriGetFromRoot("/themes/default_dark/sounds/boot.mp3"));
        await delay(3000);

        // load desktop
        await this.loadDesktop();

        while (true) {
            if (stopRequest) {
                return;
            }
            await delay(1000);
        }
    }
}
