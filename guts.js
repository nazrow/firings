const goodsEl = document.getElementById("goods");
const extrasEl = document.getElementById("extras");
const parametersEl = document.getElementById("parameters");
const stateEl = goodsEl.getElementsByClassName("state")[0];
const glazeEl = goodsEl.getElementsByClassName("glaze")[0];

function callTempBracketByName(bracket, peak) {
    semipeak = Math.floor(peak * 0.9);
    underpeak = Math.floor(peak) - 1;
    result = [null, null];
    for (j = 0; j < bracket.length; j++) {
        if (bracket[j] == semipeak) {
            result[j] = "semipeak";
        } else if (bracket[j] == underpeak) {
            result[j] = "underpeak";
        } else if (bracket[j] == Math.floor(peak)) {
            result[j] = "peak";
        } else {
            result[j] = bracket[j];
        }
    }
    return result[0] + "-" + result[1];
}

function recalculate() {
    let goods = {};
    goods.weight = Number(goodsEl.getElementsByClassName("weight")[0].value) / 1000;
    goods.thickness = Number(goodsEl.getElementsByClassName("thickness")[0].value) / 1000;
    goods.water = stateEl.options[stateEl.selectedIndex].value;
    goods.glaze = Number(glazeEl.options[glazeEl.selectedIndex].value);
    goods.inertia = Math.sqrt(goods.thickness ** 3 * goods.weight * 1600);
    goods.slower = 1 - Math.sqrt(Math.log(goods.inertia + 1));
    console.log(`${goods.weight * 1000} g @ ${goods.thickness * 1000} mm gives ${goods.inertia} kg2, x${goods.slower} slower`);

    let extras = {};
    extras.weight = Number(extrasEl.getElementsByClassName("weight")[0].value) / 1000;

    let furnace = {};
    furnace.volume = Number(extrasEl.getElementsByClassName("volume")[0].value) / 1000;
    furnace.surfaceArea = 6 * furnace.volume ** (2 / 3);
    furnace.thickness = (3 + (furnace.volume / 0.5)) / 100;
    furnace.weight = 350 * furnace.surfaceArea * furnace.thickness;
    furnace.maxLoad = furnace.volume * 1600;
    furnace.inertia = Math.sqrt(furnace.thickness ** 3 * furnace.weight * 400);
    furnace.slower = 1 - Math.sqrt(Math.log(furnace.inertia + 1)) / 4 + 0.1 - (goods.weight + extras.weight) / furnace.maxLoad / 5;
    console.log(`${furnace.volume * 1000} l furnace gives ${furnace.inertia} kg2, x${furnace.slower} slower`);

    let params = {};
    params.peak = Number(parametersEl.getElementsByClassName("temperature")[0].value);
    params.tempo = Number(parametersEl.getElementsByClassName("tempo")[0].value);
    params.skipABPhase = parametersEl.getElementsByClassName("check")[0].checked;
    params.skipBAPhase = parametersEl.getElementsByClassName("check")[1].checked;

    let temperatures = [20, Math.floor(params.peak), Math.floor(params.peak) - 1, 20];
    if (goods.water > 0) {
        temperatures.splice(1, 0, 90, 95, 110);
    }
    if (!params.skipABPhase) {
        temperatures.splice(temperatures.length - 3, 0, 550, 600);
    }
    if (goods.glaze > 0) {
        temperatures.splice(temperatures.length - 3, 0, 800, Math.floor(params.peak * 0.9));
    }
    if (goods.glaze == 2) {
        temperatures.splice(temperatures.length - 1, 0, 800);
    } else if (goods.glaze == 3) {
        temperatures.splice(temperatures.length - 1, 0, 900, 1030, 1027);
    }
    if (!params.skipBAPhase) {
        temperatures.splice(temperatures.length - 1, 0, 600, 550);
    }

    let speeds = {
        "20-90": 160 * params.tempo * goods.slower * furnace.slower,
        "20-550": 200 * params.tempo * goods.slower * furnace.slower,
        "20-800": 180 * params.tempo * goods.slower * furnace.slower,
        "20-peak": 170 * params.tempo * goods.slower * furnace.slower,
        "90-95": 5 / (goods.water - 1 + goods.thickness / 0.005) * params.tempo,
        "95-110": 40 * params.tempo * goods.slower * furnace.slower,
        "110-550": 170 * params.tempo * goods.slower * furnace.slower,
        "110-800": 180 * params.tempo * goods.slower * furnace.slower,
        "110-peak": 170 * params.tempo * goods.slower * furnace.slower,
        "550-600": 90 * params.tempo * goods.slower * furnace.slower,
        "600-800": 180 * params.tempo * goods.slower * furnace.slower,
        "600-peak": 250 * params.tempo * goods.slower * furnace.slower,
        "800-semipeak": 160 * params.tempo * goods.slower * furnace.slower,
        "800-peak": 150 * params.tempo * goods.slower * furnace.slower,
        "semipeak-peak": 120 * params.tempo * goods.slower * furnace.slower,
        "peak-underpeak": 1.5 * params.tempo * goods.slower * furnace.slower,
        "underpeak-900": 1000,
        "900-1030": 1000,
        "1030-1027": 1 * params.tempo,
        "1027-600": 900,
        "1027-20": 450,
        "underpeak-800": 150 * params.tempo,
        "underpeak-600": 850,
        "underpeak-20": 450,
        "800-600": 750,
        "800-20": 400,
        "600-550": 110 * params.tempo * goods.slower * furnace.slower,
        "550-20": 350,
    };
    mode = [];
    for (i = 0; i < temperatures.length - 1; i++) {
        name = callTempBracketByName([temperatures[i], temperatures[i + 1]], params.peak);
        speed = speeds[name];
        timeDelta = Math.floor((Math.abs(temperatures[i + 1] - temperatures[i]) / speed) * 60);
        mode.push([temperatures[i], (speed * (temperatures[i + 1] - temperatures[i])) / Math.abs(temperatures[i + 1] - temperatures[i]), timeDelta]);
    }
    didCleans = true;
    while (didCleans) {
        modeCleaned = [];
        didCleans = false;
        for (i = 0; i < mode.length; i++) {
            if (mode.length - i > 1 && mode[i][1] == mode[i + 1][1]) {
                modeCleaned.push([mode[i][0], mode[i][1], mode[i][2] + mode[i + 1][2]]);
                didCleans = true;
                break;
            } else {
                modeCleaned.push(mode[i]);
            }
        }
        mode = modeCleaned;
    }
    mode.push([20, 0, 0]);
    console.log(mode);
    time = 0;
    tabularData = "";
    graphData = [];
    for (i = 0; i < modeCleaned.length; i++) {
        graphData.push({ x: time, y: Math.floor(mode[i][0]) });
        time += mode[i][2] / 60;
        if (i < modeCleaned.length - 1) {
            tabularData += `<tr><td>${i}</td><td>${Math.floor(mode[i][0])}</td><td>${mode[i][1].toFixed(1)}</td><td>${Math.floor(mode[i][2])}</td><td>${time.toFixed(1)}</td></tr>`;
        }
    }
    var table = document.getElementsByTagName("tbody")[0];
    table.innerHTML = tabularData;
    console.log(chart);
    replaceChartData(chart, graphData);
}
