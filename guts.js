const goodsEl = document.getElementById("goods");
const extrasEl = document.getElementById("extras");
const parametersEl = document.getElementById("parameters");
const stateEl = goodsEl.getElementsByClassName("state")[0];
const glazeEl = goodsEl.getElementsByClassName("glaze")[0];


function recalculate() {
    let goods = {};
    goods.weight = Number(goodsEl.getElementsByClassName("weight")[0].value) / 1000;
    goods.thickness = Number(goodsEl.getElementsByClassName("thickness")[0].value) / 1000;
    goods.water = stateEl.options[stateEl.selectedIndex].value;
    goods.glaze = Number(glazeEl.options[glazeEl.selectedIndex].value);
    goods.inertia = Math.sqrt(goods.thickness ** 3 * goods.weight * 1600);
    goods.slower = 1 - Math.sqrt(Math.log(goods.inertia + 1));

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

    let params = {};
    params.peak = Number(parametersEl.getElementsByClassName("temperature")[0].value);
    params.tempo = Number(parametersEl.getElementsByClassName("tempo")[0].value);
    params.skipABPhase = parametersEl.getElementsByClassName("check")[0].checked;
    params.skipBAPhase = parametersEl.getElementsByClassName("check")[1].checked;

    let temperatures = [20, "peak", "underpeak", 20];
    if (goods.water > 0) {
        temperatures.splice(1, 0, 90, 95, 110);
    }
    if (!params.skipABPhase) {
        temperatures.splice(temperatures.length - 3, 0, 550, 600);
    }
    if (goods.glaze > 0) {
        temperatures.splice(temperatures.length - 3, 0, 800, "glazeentry");
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
        "800-glazeentry": 160 * params.tempo * goods.slower * furnace.slower,
        "800-peak": 150 * params.tempo * goods.slower * furnace.slower,
        "glazeentry-peak": 120 * params.tempo * goods.slower * furnace.slower,
        "peak-underpeak": 1.5 * params.tempo * goods.slower * furnace.slower,
        "underpeak-900": 1000,
        "900-1030": 1000,
        "1030-1027": params.tempo,
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
        bracket = `${temperatures[i]}-${temperatures[i + 1]}`;
        speed = speeds[bracket];
        ts = [
            Math.floor(Number(String(temperatures[i]).replace("underpeak", params.peak - 1).replace("peak", params.peak).replace("glazeentry", params.peak * 0.9))),
            Math.floor(Number(String(temperatures[i+1]).replace("underpeak", params.peak - 1).replace("peak", params.peak).replace("glazeentry", params.peak * 0.9)))
        ];
        timeDelta = Math.floor((Math.abs(ts[1] - ts[0]) / speed) * 60);
        mode.push([ts[0], (speed * (ts[1] - ts[0])) / Math.abs(ts[1] - ts[0]), timeDelta]);
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
    replaceChartData(chart, graphData);
}

recalculate();