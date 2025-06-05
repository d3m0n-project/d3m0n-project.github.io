// 4re5 group C all rights reserved

class Control {
    constructor() {
        this.name="not defined";
        this.visible=true;
        this.enabled=true;
        this.parent=NaN;
        this.margin_top=0;
        this.margin_left=0;
        this.margin_right=0;
        this.margin_bottom=0;
        this.location={x: 0, y:0};
        this.color="black"
        this.bg_color="none";
        this.width="20";
        this.height="10";
    }
    async applyProperties() {}
    async draw() {}

    async generalProperties(property, value) {
        switch(property) {
            case "name":
                this.name = value;
                break;
            case "visible":
                this.visible = (value == "true");
                break;
            case "enabled":
                this.enabled = (enabled == "true");
                break;
            case "parent":
                log("/!\\ control.parent is not yet availble /!\\");
                break;
            case "margin_top":
                if(value.includes("%")) {
                    this.margin_top = currentDevice.height * Number(value.replaceAll("%", ""))/100;
                } else {
                    this.margin_top = Number(value);
                }
                break;
            case "margin_left":
                if(value.includes("%")) {
                    this.margin_left = currentDevice.width * Number(value.replaceAll("%", ""))/100;
                } else {
                    this.margin_left = Number(value);
                }
                break;
            case "margin_right":
                if(value.includes("%")) {
                    this.margin_right = currentDevice.width * Number(value.replaceAll("%", ""))/100;
                } else {
                    this.margin_right = Number(value);
                }
                break;
            case "margin_bottom":
                if(value.includes("%")) {
                    this.margin_bottom = currentDevice.height * Number(value.replaceAll("%", ""))/100;
                } else {
                    this.margin_bottom = Number(value);
                }
                break;
            case "location":
                if(value.includes(",")) {
                    var pos = value.split(",");
                    var i=0;
                    for(let elem of pos) {
                        elem=elem.trim();
                        if(elem.includes("%")) {
                            elem=elem.replaceAll("%", "");
                            if(i == 0) { // x
                                pos[i] = currentDevice.width * Number(elem)/100;
                            } else {     // y
                                pos[i] = currentDevice.height * Number(elem)/100;
                            }
                        }
                        i++;
                    }
                    this.location.x = Number(pos[0]);
                    this.location.y = Number(pos[1]);
                    
                } else {
                    if(value == "top") {
                        this.location.x = (currentDevice.width/2)-(this.width/2);
                        this.location.y = 0;
                    } else if(value == "top_left") { 
                        this.location.x = 0;
                        this.location.y = 0; 
                    } else if(value == "top_right") { 
                        this.location.x = currentDevice.width-this.width; 
                        this.location.y = 0; 
                    } else if(value == "bottom") { 
                        this.location.x = currentDevice.width/2-this.width/2; 
                        this.location.y = currentDevice.height-this.height;
                    } else if(value == "bottom_left") { 
                        this.location.x = 0; 
                        this.location.y = currentDevice.height-this.height;
                    } else if(value == "bottom_right") { 
                        this.location.x = currentDevice.width-this.width; 
                        this.location.y = currentDevice.height-this.height;
                    } else if(value == "left") { 
                        this.location.x = 0; 
                        this.location.y = (currentDevice.height/2)-(this.height/2);
                    } else if(value == "right") { 
                        this.location.x = currentDevice.width-this.width; 
                        this.location.y = (currentDevice.height/2)-(this.height/2);
                    } else if(value == "center") { 
                        this.location.x = (currentDevice.width/2)-(this.width/2); 
                        this.location.y = (currentDevice.height/2)-(this.height/2);
                    } else {
                        log("error: unknown location: "+value);
                    }
                }
                break;
            case "color":
                if(value.includes(",")) { // rgb color
                    let rgb = value.split(",");
                    this.color = "rgb(" + Number(rgb[0].trim()) + "," + Number(rgb[1].trim()) + "," + Number(rgb[2].trim()) + ")";
                } else {
                    this.color = value;
                }
                break;
            case "bg_color":
                if(value.includes(",")) { // rgb color
                    let rgb = value.split(",");
                    this.bg_color = "rgb(" + Number(rgb[0].trim()) + "," + Number(rgb[1].trim()) + "," + Number(rgb[2].trim()) + ")";
                } else {
                    this.bg_color = value;
                }
                break;
            case "width":
                if(value.includes("%")) {
                    this.width = currentDevice.width * Number(value.replaceAll("%", ""))/100;
                } else {
                    this.width = Number(value);
                }
                break;
            case "height":
                if(value.includes("%")) {
                    this.height = currentDevice.height * Number(value.replaceAll("%", ""))/100;
                } else {
                    this.height = Number(value);
                }
                break;
            default:
                return false; // property does not exists
        }
        return true;
    }
}



class Text extends Control {
    constructor() {
        super();
        this.text_align="top-left";
        this.font_size=10;
        this.content="text";
    }
    async applyProperties(properties) {
        for(let i in properties) {
            if(properties[i].trim() != "" && properties[i].trim().includes("=")) {
                var property = properties[i].split("=")[0].trim();
                var value = properties[i].split("=")[1].trim().replaceAll('"', "");

                switch(property) {
                    case "content":
                        this.content = value;
                        break;
                    default:
                        let result = await this.generalProperties(property, value);
                        if(!result) {
                            log("/!\\ Text control does not support property '" + property + "'. /!\\");
                        }
                        break;
                }
            }
            
        }
    }
    async draw() {
        await drawText(this.location.x, this.location.y, this.content, this.color);
    }
}







class Rect extends Control {
    constructor() {
        super();
        this.scroll=false;
    }
    async applyProperties(properties) {
        for(let i in properties) {
            if(properties[i].trim() != "" && properties[i].trim().includes("=")) {
                var property = properties[i].split("=")[0].trim();
                var value = properties[i].split("=")[1].trim().replaceAll('"', "");

                switch(property) {
                    case "scroll":
                        this.scroll = (value == "true");
                        break;
                    default:
                        // log("Rect control property: " + property + " = " + value);
                        var result = await this.generalProperties(property, value);
                        if(!result) {
                            log("Rect control does not support property '" + property + "'.");
                        }
                        break;
                }
            }
            
        }
    }
    async draw() {
        if(this.bg_color != "none") {
            await drawRect(this.location.x, this.location.y, this.width, this.height, this.bg_color);
        }
    }
}






class Window extends Control {
    constructor() {
        super();
        this.title="Window";
        this.topbar=true;
    }
    async applyProperties(properties) {
        for(let i in properties) {
            if(properties[i].trim() != "" && properties[i].trim().includes("=")) {
                var property = properties[i].split("=")[0].trim();
                var value = properties[i].split("=")[1].trim().replaceAll('"', "");

                switch(property) {
                    case "title":
                        this.title = value;
                        break;
                    case "topbar":
                        log("/!\\ Window: top bar todo /!\\");
                        break;
                    default:
                        let result = await this.generalProperties(property, value);
                        if(!result) {
                            log("Window control does not support property '" + property + "'.");
                        }
                        break;
                }
            }
            
        }
    }
    async draw() {
        await drawRect(0, 0, currentDevice.width, currentDevice.height, this.bg_color);
    }
}