const goodsForm = `<div class="goods" id="goodsnumber">
    <button class="remove" onclick="deleteGoods(number)">×</button>
    <div>
        Состояние:
        <select class="state" onchange="recalculate()">
            <option value="1">сырец <span>(еще не обжигалось)</span></option>
            <option value="0">утиль / изделие <span>(обжигалось выше 600°C)</span></option>
        </select>
    </div>
    <div>Вес: <input type="number" class="weight" onchange="recalculate()" value="100" />г</div>
    <div>Длина:<input type="number" class="length" onchange="recalculate()" value="35" />мм</div>
    <div>Ширина:<input type="number" class="width" onchange="recalculate()" value="55" />мм</div>
    <div>Высота:<input type="number" class="height" onchange="recalculate()" value="95" />мм</div>
    <div>
        Рельефность формы:
        <div class="shaperangewithlegend">
            <input class="shape" type="range" min="0.4" max="2.5" value="0.7" step="0.01" onchange="recalculate()" />
            <div class="shapelegend"><span class="sphere">шар</span><span class="cup">чашка</span><span class="radiator">радиатор</span></div>
        </div>
    </div>
    <div>Средняя толщина стенки: <input type="number" class="thickness" onchange="recalculate()" value="2.8" />мм</div>
    <div>
        Глазурь:
        <select class="glaze" onchange="recalculate()">
            <option value="0">отсутствует</option>
            <option value="1">выносливая</option>
            <option value="2">капризная</option>
            <option value="3">кристаллическая</option>
        </select>
    </div>
</div>`;
const goods = document.getElementById("goods");
const extras = document.getElementById("extras");
const parameters = document.getElementById("parameters");
var goodsCount = 0;
addGoods();

function recalculateGoods(root) {
    var result = {};
    var state = root.getElementsByClassName("state")[0];
    result.hasWater = state.options[state.selectedIndex].value == 1;
    result.weight = Number(root.getElementsByClassName("weight")[0].value) / 1000;
    result.length = Number(root.getElementsByClassName("length")[0].value) / 1000;
    result.width = Number(root.getElementsByClassName("width")[0].value) / 1000;
    result.height = Number(root.getElementsByClassName("height")[0].value) / 1000;
    result.thickness = Number(root.getElementsByClassName("thickness")[0].value) / 1000;
    result.shape = Number(root.getElementsByClassName("shape")[0].value);
    result.surfaceArea = 2 * (result.width * result.length + result.length * result.height + result.height * result.width) * result.shape;
    var glaze = root.getElementsByClassName("glaze")[0];
    result.glaze = Number(glaze.options[glaze.selectedIndex].value);
    result.inertia = Math.sqrt((result.thickness ** 2 * result.weight ** 2) / result.surfaceArea);
    return result;
}

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
    var goodsArray = Array.from(goods.children);
    var goodsObjects = [];
    goodsArray.forEach((element) => goodsObjects.push(recalculateGoods(element)));
    var goodsAgg = {};
    goodsAgg.weight = goodsObjects.reduce((total, currentValue) => total + currentValue.weight, 0);
    goodsAgg.surfaceArea = goodsObjects.reduce((total, currentValue) => total + currentValue.surfaceArea, 0);
    goodsAgg.thickness = goodsObjects.reduce((total, currentValue) => total + currentValue.thickness * currentValue.weight, 0) / goodsAgg.weight;
    goodsAgg.inertia = Math.sqrt((goodsAgg.thickness ** 2 * goodsAgg.weight ** 2) / goodsAgg.surfaceArea);
    goodsAgg.glaze = goodsObjects.reduce((total, currentValue) => Math.max(total, currentValue.glaze), 0);
    goodsAgg.wetness = goodsObjects.reduce((total, currentValue) => total + currentValue.weight * currentValue.hasWater, 0) / goodsAgg.weight;
    var waterCheck = parameters.getElementsByClassName("check")[0];
    // waterCheck.checked = !(goodsAgg.wetness > 0)
    extrasObj = {};
    var weight = Number(extras.getElementsByClassName("weight")[0].value) / 1000;
    var volume = weight / 1950;
    var furnace = {};
    furnace.volume = Number(extras.getElementsByClassName("volume")[0].value) / 1000;
    furnace.surfaceArea = 6 * furnace.volume ** (2 / 3);
    furnace.weight = 350 * furnace.surfaceArea * 0.03;
    extrasObj.weight = weight + furnace.weight;
    extrasObj.thickness = (0.015 * weight + 0.03 * furnace.weight) / extrasObj.weight;
    extrasObj.surfaceArea = volume / 0.015 + furnace.surfaceArea;
    extrasObj.inertia = Math.sqrt((extrasObj.thickness ** 2 * extrasObj.weight ** 2) / extrasObj.surfaceArea);
    var paramsObj = {};
    paramsObj.peak = Number(parameters.getElementsByClassName("temperature")[0].value);
    paramsObj.tempo = Number(parameters.getElementsByClassName("tempo")[0].value);
    paramsObj.skipSteaming = waterCheck.checked;
    paramsObj.skipABPhase = parameters.getElementsByClassName("check")[1].checked;
    paramsObj.skipBAPhase = parameters.getElementsByClassName("check")[2].checked;
    var temperatures = [20, Math.floor(paramsObj.peak), Math.floor(paramsObj.peak) - 1, 20];
    if (!paramsObj.skipSteaming) {
        temperatures.splice(1, 0, 95, 105);
    }
    if (!paramsObj.skipABPhase) {
        temperatures.splice(temperatures.length - 3, 0, 550, 600);
    }
    if (goodsAgg.glaze > 0) {
        temperatures.splice(temperatures.length - 3, 0, 800, Math.floor(paramsObj.peak * 0.9));
    }
    if (goodsAgg.glaze == 2) {
        temperatures.splice(temperatures.length - 1, 0, 800);
    } else if (goodsAgg.glaze == 3) {
        temperatures.splice(temperatures.length - 1, 0, 900, 1030, 1027);
    }
    if (!paramsObj.skipBAPhase) {
        temperatures.splice(temperatures.length - 1, 0, 600, 550);
    }
    var speeds = {
        "20-95": 150 * paramsObj.tempo * (1 - goodsAgg.inertia / 0.045) * (1 - extrasObj.inertia / 0.9),
        "20-550": 120 * paramsObj.tempo * (1 - goodsAgg.inertia / 0.11) * (1 - extrasObj.inertia / 2),
        "20-800": 120 * paramsObj.tempo * (1 - goodsAgg.inertia / 0.11) * (1 - extrasObj.inertia / 2),
        "20-peak": 120 * paramsObj.tempo * (1 - goodsAgg.inertia / 0.11) * (1 - extrasObj.inertia / 2),
        "95-105": 40 * paramsObj.tempo * (1 - goodsAgg.inertia / 0.045) * (1 - extrasObj.inertia / 0.9),
        "105-550": 170 * paramsObj.tempo * (1 - goodsAgg.inertia / 0.045) * (1 - extrasObj.inertia / 0.9),
        "105-800": 120 * paramsObj.tempo * (1 - goodsAgg.inertia / 0.11) * (1 - extrasObj.inertia / 2),
        "105-peak": 120 * paramsObj.tempo * (1 - goodsAgg.inertia / 0.11) * (1 - extrasObj.inertia / 2),
        "550-600": 60 * paramsObj.tempo * (1 - goodsAgg.inertia / 0.045) * (1 - extrasObj.inertia / 0.9),
        "600-800": 300 * paramsObj.tempo * (1 - goodsAgg.inertia / 0.045) * (1 - extrasObj.inertia / 0.9),
        "600-peak": 250 * paramsObj.tempo * (1 - goodsAgg.inertia / 0.045) * (1 - extrasObj.inertia / 0.9),
        "800-semipeak": 350 * paramsObj.tempo * (1 - goodsAgg.inertia / 0.045) * (1 - extrasObj.inertia / 0.9),
        "800-peak": 300 * paramsObj.tempo * (1 - goodsAgg.inertia / 0.045) * (1 - extrasObj.inertia / 0.9),
        "semipeak-peak": 250 * paramsObj.tempo * (1 - goodsAgg.inertia / 0.045) * (1 - extrasObj.inertia / 0.9),
        "peak-underpeak": 2 * paramsObj.tempo * (1 - goodsAgg.inertia / 0.045) * (1 - extrasObj.inertia / 0.9),
        "underpeak-900": 1000,
        "900-1030": 1000,
        "1030-1027": 1 * paramsObj.tempo,
        "1027-600": 900,
        "1027-20": 450,
        "underpeak-800": 150 * paramsObj.tempo,
        "underpeak-600": 850,
        "underpeak-20": 450,
        "800-600": 750,
        "800-20": 400,
        "600-550": 60 * paramsObj.tempo * (1 - goodsAgg.inertia / 0.09) * (1 - extrasObj.inertia / 1.8),
        "550-20": 350,
    };
    mode = [];
    for (i = 0; i < temperatures.length - 1; i++) {
        name = callTempBracketByName([temperatures[i], temperatures[i + 1]], paramsObj.peak);
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
        tabularData += `<tr><td>${i}</td><td>${Math.floor(mode[i][0])}</td><td>${Math.floor(mode[i][1])}</td><td>${Math.floor(mode[i][2])}</td><td>${time.toFixed(1)}</td></tr>`;
    }
    var table = document.getElementsByTagName("tbody")[0];
    table.innerHTML = tabularData;
    console.log(chart);
    replaceChartData(chart, graphData);
}

function addGoods() {
    goodsContent = goodsForm.replaceAll("number", goodsCount);
    goods.insertAdjacentHTML("beforeend", goodsContent);
    goodsCount += 1;
    recalculate();
}

function deleteGoods(number) {
    target = document.getElementById("goods" + number);
    target.remove();
    recalculate();
}
