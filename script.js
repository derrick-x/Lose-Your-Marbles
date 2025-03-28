var gameStage = 0; //0 = start menu, 1 = drawing, 2 = simulating
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
var mouseEvents = [];
var keyEvents = [];

const firebaseConfig = {
    //firebaseConfig
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

ctx.fillStyle = "rgb(135, 206, 235)";
ctx.fillRect(0, 0, 1000, 1000);
canvas.addEventListener("mousemove", (e) => {
    let rect = canvas.getBoundingClientRect();
    mouseEvents.push([e.clientX - rect.left, e.clientY - rect.top]);

});
canvas.addEventListener("mousedown", (e) => {
    mouseEvents.push(true);
});
canvas.addEventListener("mouseup", (e) => {
    mouseEvents.push(false);
});
document.addEventListener("keydown", (e) => {
    keyEvents.push([e.keyCode, true])
});
document.addEventListener("keyup", (e) => {
    keyEvents.push([e.keyCode, false]);
});

var mouseX = -1;
var mouseY = -1;
var mouseDown = false;
var keys = new Array(128).fill(false);
var lines = [];
var bouncers = [];
var blackHoles = [];
var springs = [];
var ballX = 50;
var ballY = 50;
var xVel = 0;
var yVel = 0;
var select = 0;
var placing = [];
const GRAVITY = 0.2;

function lineCollision(x, y, radius) {
    let closest = [[-1]];
    for (let i = 0; i < lines.length; i++) {
        let dist0 = Math.hypot(x - lines[i][0], y - lines[i][1]);
        let dist1 = Math.hypot(x - lines[i][2], y - lines[i][3]);
        //calculate normal intersection
        let xb = ballX - lines[i][0];
        let yb = ballY - lines[i][1];
        let x1 = lines[i][2] - lines[i][0];
        let y1 = lines[i][3] - lines[i][1];
        let t = (x1 * xb + y1 * yb) / (x1 * x1 + y1 * y1);
        if (t > 0 && t < 1 && Math.hypot(ballX - lines[i][0] - t * (lines[i][2] - lines[i][0]), ballY - lines[i][1] - t * (lines[i][3] - lines[i][1])) < radius) {
            closest.push([i, lines[i][0] + t * (lines[i][2] - lines[i][0]), lines[i][1] + t * (lines[i][3] - lines[i][1])]);
        }
        if (dist0 < radius) {
            closest.push([i, lines[i][0], lines[i][1]]);
        }
        if (dist1 < radius) {
            closest.push([i, lines[i][2], lines[i][3]]);
        }
        if (closest.length > 1) {
            if (closest[0][0] == -1 || Math.hypot(ballX - closest[1][1], ballY - closest[1][2]) < Math.hypot(ballX - closest[0][1], ballY - closest[0][2])) {
                closest.shift();
            }
            else {
                closest.pop();
            }
        }
    }
    return closest[0];
}
function gameTick() {
    while (mouseEvents.length > 0) {
        if (mouseEvents[0] === true) {
            mouseDown = true;
        }
        else if (mouseEvents[0] === false) {
            if (placing.length > 0) {
                if (select == 1) {
                    bouncers.push([placing[0], placing[1], Math.hypot(placing[0] - mouseX, placing[1] - mouseY)]);
                }
                else if (select == 2) {
                    blackHoles.push([placing[0], placing[1], (placing[0] - mouseX) * (placing[0] - mouseX) + (placing[1] - mouseY) * (placing[1] - mouseY)]);
                }
                placing = [];
            }
            mouseDown = false;
        }
        else {
            if (mouseDown && mouseX > -1 && mouseY > 100 && mouseY < 900 && gameStage == 1) {
                if (select == 0) {
                    if (mouseEvents[0][0] != mouseX || mouseEvents[0][1] != mouseY) {
                        lines.push([mouseX, mouseY, mouseEvents[0][0], mouseEvents[0][1]]);
                    }
                }
                else if (select == 1) {
                    if (placing.length == 0) {
                        placing = [mouseX, mouseY];
                    }
                }
                else if (select == 2) {
                    if (placing.length == 0) {
                        placing = [mouseX, mouseY];
                    }
                }
                else {
                    let collide = lineCollision(mouseX, mouseY, 10);
                    if (collide[0] > -1) {
                        lines.splice(collide[0], 1);
                    }
                    for (let i = 0; i < bouncers.length; i++) {
                        if (Math.hypot(bouncers[i][0] - mouseX, bouncers[i][1] - mouseY) < bouncers[i][2]) {
                            bouncers.splice(i, 1);
                        }
                    }
                    for (let i = 0; i < blackHoles.length; i++) {
                        if ((blackHoles[i][0] - mouseX) * (blackHoles[i][0] - mouseX) + (blackHoles[i][1] - mouseY) * (blackHoles[i][1] - mouseY) < blackHoles[i][2]) {
                            blackHoles.splice(i, 1);
                        }
                    }
                }
            }
            mouseX = mouseEvents[0][0];
            mouseY = mouseEvents[0][1];
        }
        mouseEvents.shift();
    }
    if (gameStage == 1) {
        if (mouseY > 0 && mouseY < 100 && mouseDown) {
            if (mouseX > 75 && mouseX < 175) {
                select = 0;
            }
            if (mouseX > 175 && mouseX < 275) {
                select = 1;
            }
            if (mouseX > 275 && mouseX < 375) {
                select = 2;
            }
            if (mouseX > 375 && mouseX < 475) {
                select = 3;
            }
        }
    }
    while (keyEvents.length > 0) {
        if (keyEvents[0][1]) {
            keys[keyEvents[0][0]] = true;
        }
        else {
            keys[keyEvents[0][0]] = false;
        }
        if (keys[13]) {
            gameStage = 2;
        }
        keyEvents.shift();
    }
    if (gameStage == 2) {
        //ball physics
        for (let i = 0; i < 100; i++) {
            ballX += xVel / 100.0;
            ballY += yVel / 100.0;
            let collision = lineCollision(ballX, ballY, 10);
            if (collision[0] > -1) {
                ballX -= xVel / 100.0;
                ballY -= yVel / 100.0;
                let normal = (xVel * (ballX - collision[1]) + yVel * (ballY - collision[2])) / Math.hypot(ballX - collision[1], ballY - collision[2]);
                xVel -= (ballX - collision[1]) * normal / Math.hypot(ballX - collision[1], ballY - collision[2]);
                yVel -= (ballY - collision[2]) * normal / Math.hypot(ballX - collision[1], ballY - collision[2]);
                ballX += xVel / 100.0;
                ballY += yVel / 100.0;
            }
            for (let i = 0; i < bouncers.length; i++) {
                if (Math.hypot(ballX - bouncers[i][0], ballY - bouncers[i][1]) < bouncers[i][2] + 10) {
                    ballX -= xVel / 100.0;
                    ballY -= yVel / 100.0;
                    let vector = [ballX - bouncers[i][0], ballY - bouncers[i][1]];
                    let dotProd = vector[0] * xVel + vector[1] * yVel;
                    let projection = [vector[0] * dotProd / (Math.hypot(vector[0], vector[1]) * Math.hypot(vector[0], vector[1])), vector[1] * dotProd / (Math.hypot(vector[0], vector[1]) * Math.hypot(vector[0], vector[1]))];
                    xVel -= 2 * projection[0];
                    yVel -= 2 * projection[1];
                    ballX += xVel / 100.0;
                    ballY += yVel / 100.0;
                }
            }
            for (let i = 0; i < blackHoles.length; i++) {
                let dist = Math.hypot(ballX - blackHoles[i][0], ballY - blackHoles[i][1]);
                xVel += blackHoles[i][2] * (blackHoles[i][0] - ballX) / (dist * dist * 1000);
                yVel += blackHoles[i][2] * (blackHoles[i][1] - ballY) / (dist * dist * 1000);
            }
            yVel += GRAVITY / 100.0;
        }
    }
    //drawing
    ctx.lineWidth = 1;
    ctx.fillStyle = "rgb(135, 206, 235)";
    ctx.fillRect(0, 0, 1000, 1000);
    if (gameStage == 1) {
        ctx.fillStyle = "rgb(90, 138, 156)";
        ctx.fillRect(0, 0, 1000, 100);
        ctx.fillRect(0, 900, 1000, 100);
    }
    ctx.fillStyle = "rgb(0, 255, 0)";
    for (let i = 0; i < bouncers.length; i++) {
        ctx.beginPath();
        ctx.arc(bouncers[i][0], bouncers[i][1], bouncers[i][2], 0, 2 * Math.PI, true);
        ctx.fill();
    }
    ctx.fillStyle = "rgb(0, 0, 0)";
    for (let i = 0; i < blackHoles.length; i++) {
        ctx.beginPath();
        ctx.arc(blackHoles[i][0], blackHoles[i][1], Math.sqrt(blackHoles[i][2]), 0, 2 * Math.PI, true);
        ctx.fill();
    }
    ctx.strokeStyle = "rgb(85, 85, 85)";
    for (let i = 0; i < lines.length; i++) {
        ctx.beginPath();
        ctx.moveTo(lines[i][0], lines[i][1]);
        ctx.lineTo(lines[i][2], lines[i][3]);
        ctx.stroke();
    }
    ctx.fillStyle = "rgb(255, 0, 0)"
    ctx.beginPath();
    ctx.arc(ballX, ballY, 10, 0, 2 * Math.PI, true);
    ctx.fill();
    if (placing.length > 0) {
        if (select == 1) {
            ctx.fillStyle = "rgb(0, 255, 0)";
            ctx.beginPath();
            ctx.arc(placing[0], placing[1], Math.hypot(placing[0] - mouseX, placing[1] - mouseY), 0, 2 * Math.PI, true);
            ctx.fill();
        }
        else if (select == 2) {
            ctx.fillStyle = "rgb(0, 0, 0)";
            ctx.beginPath();
            ctx.arc(placing[0], placing[1], Math.hypot(placing[0] - mouseX, placing[1] - mouseY), 0, 2 * Math.PI, true);
            ctx.fill();
        }
    }
    if (gameStage == 1) {
        ctx.strokeStyle = "rgb(85, 85, 85)";
        ctx.beginPath();
        ctx.moveTo(100, 25);
        ctx.lineTo(150, 75);
        ctx.stroke();
        ctx.fillStyle = "rgb(0, 255, 0)";
        ctx.beginPath();
        ctx.arc(225, 50, 25, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.fillStyle = "rgb(0, 0, 0)";
        ctx.beginPath();
        ctx.arc(325, 50, 25, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.strokeStyle = "rgb(255, 0, 0)";
        ctx.beginPath();
        ctx.moveTo(400, 25);
        ctx.lineTo(450, 75);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(450, 25);
        ctx.lineTo(400, 75);
        ctx.stroke();
        ctx.strokeStyle = "rgb(0, 0, 0)";
        if (mouseY > 0 && mouseY < 100) {
            if (mouseX > 75 && mouseX < 175) {
                ctx.strokeRect(75, 0, 100, 100);
            }
            if (mouseX > 175 && mouseX < 275) {
                ctx.strokeRect(175, 0, 100, 100);
            }
            if (mouseX > 275 && mouseX < 375) {
                ctx.strokeRect(275, 0, 100, 100);
            }
            if (mouseX > 375 && mouseX < 475) {
                ctx.strokeRect(375, 0, 100, 100);
            }
        }
        ctx.lineWidth = 10;
        ctx.strokeRect(80 + select * 100, 5, 90, 90);
    }
    requestAnimationFrame(gameTick);
}

function gameInit() {
    gameStage = 1;
    document.getElementById("create").hidden = true;
    document.getElementById("loadName").hidden = true;
    document.getElementById("load").hidden = true;
    document.getElementById("saveName").hidden = false;
    document.getElementById("save").hidden = false;
    document.getElementById("canvas").hidden = false;
    gameTick();
}

function loadMap() {
    let map = db.collection("maps").doc(document.getElementById("loadName").value);
    map.get().then((doc) => {
        if (!doc.exists) {
            return;
        }
        let data = doc.data();
        console.log(data);
        for (let i = 0; i < data.lines.length; i++) {
            lines.push([data.lines[i].x1, data.lines[i].y1, data.lines[i].x2, data.lines[i].y2]);
        }
        for (let i = 0; i < data.bouncers.length; i++) {
            bouncers.push([data.bouncers[i].x, data.bouncers[i].y, data.bouncers[i].r]);
        }
        for (let i = 0; i < data.blackHoles.length; i++) {
            blackHoles.push([data.blackHoles[i].x, data.blackHoles[i].y, data.blackHoles[i].r]);
        }
        for (let i = 0; i < data.springs.length; i++) {
            springs.push([data.springs[i].x, data.springs[i].y, data.springs[i].r]);
        }
        gameInit();
    });
}

function saveMap() {
    let lineSave = [];
    for (let i = 0; i < lines.length; i++) {
        lineSave.push({x1: lines[i][0], y1: lines[i][1], x2: lines[i][2], y2: lines[i][3]});
    }
    let bouncerSave = [];
    for (let i = 0; i < bouncers.length; i++) {
        bouncerSave.push({x: bouncers[i][0], y: bouncers[i][1], r: bouncers[i][2]});
    }
    let blackHoleSave = [];
    for (let i = 0; i < blackHoles.length; i++) {
        blackHoleSave.push({x: blackHoles[i][0], y: blackHoles[i][1], r: blackHoles[i][2]});
    }
    let springSave = [];
    for (let i = 0; i < springs.length; i++) {
        springSave.push({x: springs[i][0], y: springs[i][1], r: springs[i][2]});
    }
    db.collection("maps").doc(document.getElementById("saveName").value).set({
        lines: lineSave,
        bouncers: bouncerSave,
        blackHoles: blackHoleSave,
        springs: springSave
    });
}
