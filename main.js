function $(id) {
    return document.getElementById(id);
}

const CONFIG_LIST_FILE = 'config/config-list.json';
const IS_FILE_PROTOCOL = window.location.protocol === 'file:';
const STATUS_TEXT = {
    idle: 'config フォルダー内の JSON ファイルを選択してください。',
    loading: '読み込み中です...',
    success: 'config を読み込みました。',
    error: 'エラーが発生しました。JSON の形式とパスを確認してください。'
};
let popupWindow = null;
let stationList = [];
let statusList = [
    { id: '0', name: '走行中' },
    { id: '1', name: '到着中' },
    { id: '2', name: '停車中' },
    { id: '3', name: '発車前' }
];
let stationState = {
    origin: null,
    terminal: null,
    current: null
};
let originIndex = null;
let terminalIndex = null;
let currentIndex = null;
let currentStatus = null;
let configState = null;
let selectedType = null;
let startButton = null;
let pauseButton = null;
let prevStationButton = null;
let nextStationButton = null;
let prevStatusButton = null;
let nextStatusButton = null;
let reverseButton = null;
let typeSelect = null;
let popupReady = false;
let isPaused = false;

window.addEventListener('DOMContentLoaded', () => {
    const configSelect = $('configFile');
    const originSelect = $('originStation');
    const terminalSelect = $('terminalStation');
    const currentSelect = $('currentStation');
    const statusSelect = $('currentStatus');
    typeSelect = $('trainType');
    startButton = $('startButton');
    pauseButton = $('pauseButton');
    prevStationButton = $('prevStationButton');
    nextStationButton = $('nextStationButton');
    prevStatusButton = $('prevStatusButton');
    nextStatusButton = $('nextStatusButton');
    reverseButton = $('reverseButton');

    configSelect.addEventListener('change', handleConfigFileChange);
    originSelect.addEventListener('change', handleStationSelectionChange);
    terminalSelect.addEventListener('change', handleStationSelectionChange);
    currentSelect.addEventListener('change', handleStationSelectionChange);
    statusSelect.addEventListener('change', handleStationSelectionChange);
    typeSelect.addEventListener('change', handleTypeSelectionChange);
    startButton.addEventListener('click', handleStartButtonClick);
    if (pauseButton) {
        pauseButton.addEventListener('click', handlePauseButtonClick);
    }
    if (prevStationButton) {
        prevStationButton.addEventListener('click', handlePrevStationClick);
    }
    if (nextStationButton) {
        nextStationButton.addEventListener('click', handleNextStationClick);
    }
    if (prevStatusButton) {
        prevStatusButton.addEventListener('click', handlePrevStatusClick);
    }
    if (nextStatusButton) {
        nextStatusButton.addEventListener('click', handleNextStatusClick);
    }
    if (reverseButton) {
        reverseButton.addEventListener('click', handleReverseClick);
    }

    if (IS_FILE_PROTOCOL) {
        setStatus('file:// では fetch がブラウザにより制限されます。ローカル HTTP サーバーで index.html を配信してください（例: python -m http.server 8000）。', true);
        populateConfigSelect(['jn.json']);
        return;
    }

    setStartButtonEnabled(false);
    setPauseButtonEnabled(false);
    setStatus(STATUS_TEXT.idle, false);
    loadConfigList();
});

window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) {
        return;
    }
    const message = event.data;
    if (!message || message.type !== 'popupLoaded') {
        return;
    }
    popupReady = true;
    sendStationDataToFrames();
});

async function loadConfigList() {
    try {
        const response = await fetch(CONFIG_LIST_FILE);
        if (!response.ok) {
            throw new Error(`config list fetch failed: ${response.status}`);
        }
        const configs = await response.json();
        populateConfigSelect(configs);
    } catch (error) {
        console.warn('Could not load config list:', error);
        populateConfigSelect(['jn.json']);
        setStatus('config リストの読み込みに失敗しました。既定の設定を使用します。', true);
    }
}

function populateConfigSelect(configFiles) {
    const configSelect = $('configFile');
    configSelect.innerHTML = '<option value="">-- 選択してください --</option>';
    configFiles.filter(Boolean).forEach((fileName) => {
        const option = document.createElement('option');
        option.value = fileName;
        option.textContent = fileName;
        configSelect.appendChild(option);
    });
}

function handleConfigFileChange(event) {
    const configFileName = event.target.value;
    if (!configFileName) {
        return;
    }

    const configPath = `config/${configFileName}`;
    loadConfigFromPath(configPath);
}

async function loadConfigFromPath(path) {
    setStatus(STATUS_TEXT.loading, false);
    setStartButtonEnabled(false);
    popupReady = false;
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${path}: ${response.status}`);
        }

        const config = await response.json();
        configState = config;
        stationList = config.data ? await loadStationData(normalizePagePath(config.data)) : [];
        populateStationSelects(stationList);
        populateTypeSelect(config.types);
        renderConfig(config, path);
        setStartButtonEnabled(true);
        setStatus('config を読み込みました。始発・終着・現在を確認し、開始ボタンを押してください。', false);
    } catch (error) {
        console.error('Config load error:', error);
        setStatus('JSON の読み込みに失敗しました。', true);
    }
}

function handleStartButtonClick() {
    if (!configState) {
        setStatus('config が読み込まれていません。', true);
        return;
    }
    if (!stationState.origin || !stationState.terminal || !stationState.current) {
        setStatus('始発・終着・現在の駅を選択してください。', true);
        return;
    }
    popupReady = false;
    isPaused = false;
    setPauseButtonLabel(isPaused);
    setStatus('ポップアップを開始します。', false);
    openPopupWindow(configState, configState.title || 'LCD Display');
    sendStationDataToFrames();
    setPauseButtonEnabled(true);
}

function setStartButtonEnabled(enabled) {
    if (!startButton) {
        return;
    }
    startButton.disabled = !enabled;
}

function setPauseButtonEnabled(enabled) {
    if (!pauseButton) {
        return;
    }
    pauseButton.disabled = !enabled;
}

function setPauseButtonLabel(paused) {
    if (!pauseButton) {
        return;
    }
    pauseButton.textContent = paused ? '更新再開' : '更新停止';
}

function handlePauseButtonClick() {
    isPaused = !isPaused;
    setPauseButtonLabel(isPaused);
    sendPauseCommand(isPaused);
    updateStationSelectionStatus();
}

function sendPauseCommand(paused) {
    if (!popupWindow || popupWindow.closed) {
        setPauseButtonEnabled(false);
        return;
    }
    const messageType = paused ? 'pauseUpdate' : 'resumeUpdate';
    popupWindow.postMessage({ type: messageType }, window.location.origin);
}

async function loadStationData(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to fetch station data: ${response.status}`);
        }
        const csvText = await response.text();
        return parseCsv(csvText);
    } catch (error) {
        console.warn('Station CSV load error:', error);
        return [];
    }
}

function parseCsv(csvText) {
    const rows = csvText.trim().split(/\r?\n/).filter(Boolean);
    if (rows.length < 2) {
        return [];
    }

    const headers = rows[0].split(',').map((header) => header.trim());
    return rows.slice(1).map((row) => {
        const values = row.split(',').map((value) => value.trim());
        return headers.reduce((record, key, index) => {
            record[key] = values[index] || '';
            return record;
        }, {});
    });
}

function populateStationSelects(stations) {
    const originSelect = $('originStation');
    const terminalSelect = $('terminalStation');
    const currentSelect = $('currentStation');
    const statusSelect = $('currentStatus');
    [originSelect, terminalSelect, currentSelect].forEach((select) => {
        select.innerHTML = '<option value="">-- なし --</option>';
    });

    if (stations.length === 0) {
        [originSelect, terminalSelect, currentSelect].forEach((select) => {
            select.disabled = true;
        });
        setPrevNextButtonsEnabled(false);
        stationState = { origin: null, terminal: null, current: null };
        return;
    }

    if (originIndex == null) {
        originIndex = 0;
    }
    if (terminalIndex == null) {
        terminalIndex = stations.length - 1;
    }
    if (currentIndex == null) {
        currentIndex = originIndex;
    }

    stations.forEach((station, index) => {
        const label = [station.stanumber || station.staNo, station.jp || station.en].filter(Boolean).join(' ');
        const option = document.createElement('option');
        option.value = String(index);
        option.textContent = label || `駅 ${index + 1}`;
        originSelect.appendChild(option.cloneNode(true));
        terminalSelect.appendChild(option.cloneNode(true));
        
        if (index >= Math.min(originIndex, terminalIndex) && index <= Math.max(originIndex, terminalIndex)) {
            currentSelect.appendChild(option.cloneNode(true));
        }
    });

    originSelect.disabled = false;
    terminalSelect.disabled = false;
    currentSelect.disabled = false;
    statusSelect.disabled = false;
    setPrevNextButtonsEnabled(true);

    originSelect.value = originIndex;
    terminalSelect.value = terminalIndex;
    if (currentIndex < Math.min(originIndex, terminalIndex) || currentIndex > Math.max(originIndex, terminalIndex)) {
        currentIndex = originIndex;
    }
    currentSelect.value = currentIndex;

    if (currentStatus == null) {
        currentStatus = 2;
    }
    statusSelect.value = String(currentStatus);

    stationState.origin = stations[originIndex];
    stationState.terminal = stations[terminalIndex];
    stationState.current = stations[currentIndex];
    updateStationSelectionStatus();
}

function setPrevNextButtonsEnabled(enabled) {
    if (prevStationButton) {
        prevStationButton.disabled = !enabled;
    }
    if (nextStationButton) {
        nextStationButton.disabled = !enabled;
    }
    if (prevStatusButton) {
        prevStatusButton.disabled = !enabled;
    }
    if (nextStatusButton) {
        nextStatusButton.disabled = !enabled;
    }
    if (reverseButton) {
        reverseButton.disabled = !enabled;
    }
}



function handlePrevStationClick() {
    const currentSelect = $('currentStation');
    const currentIndex = Number(currentSelect.value);
    const direction = originIndex < terminalIndex ? 1 : -1;
    if (currentIndex*direction > originIndex*direction) {
        currentSelect.value = String(currentIndex - direction);
        handleStationSelectionChange();
    }
}

function handleNextStationClick() {
    const currentSelect = $('currentStation');
    const currentIndex = Number(currentSelect.value);
    const direction = originIndex < terminalIndex ? 1 : -1;
    if (currentIndex*direction < terminalIndex*direction) {
        currentSelect.value = String(currentIndex + direction);
        handleStationSelectionChange();
    }
}

function handlePrevStatusClick() {
    const statusSelect = $('currentStatus');
    const statusIndex = Number(statusSelect.value);
    const direction = originIndex < terminalIndex ? 1 : -1;
    if (!(currentIndex*direction <= originIndex*direction && statusIndex <= 2)) {
        if (stationList[currentIndex][selectedType.id] == '') {
            statusSelect.value = String(0);
            handlePrevStationClick();
        } else if (statusIndex > 0) {
            statusSelect.value = String(statusIndex - 1);
            handleStationSelectionChange();
        } else {
            statusSelect.value = String(statusList.length - 1);
            handlePrevStationClick();
        }
    }
}

function handleNextStatusClick() {
    const statusSelect = $('currentStatus');
    const statusIndex = Number(statusSelect.value);
    const direction = originIndex < terminalIndex ? 1 : -1;
    if (!(currentIndex*direction >= terminalIndex*direction && statusIndex >= 2)) {
        if (stationList[currentIndex][selectedType.id] == '') {
            statusSelect.value = String(0);
            handleNextStationClick();
        } else if (statusIndex < statusList.length - 1) {
            statusSelect.value = String(statusIndex + 1);
            handleStationSelectionChange();
        } else {
            statusSelect.value = String(0);
            handleNextStationClick();
        }
    }
}

function handleReverseClick() {
    const originSelect = $('originStation');
    const terminalSelect = $('terminalStation');
    const currentSelect = $('currentStation');
    const statusSelect = $('currentStatus');
    let origin = originSelect.value;
    let terminal = terminalSelect.value;
    originSelect.value = terminal;
    terminalSelect.value = origin;
    currentSelect.value = terminal;
    statusSelect.value = '2'; 
    handleStationSelectionChange();
}


function handleStationSelectionChange() {
    originIndex = Number($('originStation').value);
    terminalIndex = Number($('terminalStation').value);
    currentIndex = Number($('currentStation').value);
    currentStatus = Number($('currentStatus').value);

    stationState.origin = stationList[originIndex] || null;
    stationState.terminal = stationList[terminalIndex] || null;
    stationState.current = stationList[currentIndex] || null;

    updateStationSelectionStatus();
    sendStationDataToFrames();
    populateStationSelects(stationList);
}

function handleTypeSelectionChange() {
    const selectedTypeId = typeSelect?.value;
    if (!selectedTypeId || !Array.isArray(configState?.types)) {
        selectedType = null;
    } else {
        selectedType = configState.types.find((type) => type.id === selectedTypeId) || null;
    }
    updateStationSelectionStatus();
    sendStationDataToFrames();
}

function updateStationSelectionStatus() {
    const originName = stationState.origin?.jp || stationState.origin?.en || 'なし';
    const terminalName = stationState.terminal?.jp || stationState.terminal?.en || 'なし';
    const currentName = stationState.current?.jp || stationState.current?.en || 'なし';
    const typeName = selectedType?.name || selectedType?.name_en || 'なし';
    setStatus(`種別: ${typeName} / 始発: ${originName} / 終着: ${terminalName} / 現在: ${currentName}`, false);
    console.log('Station selection updated:', {
        originIndex,
        terminalIndex,
        currentIndex,
        currentStatus
    });
}

function populateTypeSelect(types) {
    if (!typeSelect) {
        return;
    }
    typeSelect.innerHTML = '<option value="">-- なし --</option>';
    if (!Array.isArray(types) || types.length === 0) {
        typeSelect.disabled = true;
        selectedType = null;
        return;
    }
    types.forEach((type) => {
        const option = document.createElement('option');
        option.value = type.id || '';
        option.textContent = type.name || type.name_en || type.id || '種別';
        typeSelect.appendChild(option);
    });
    typeSelect.disabled = false;
    selectedType = types[0];
    typeSelect.value = selectedType.id;
}

function renderConfig(config, fileName) {
    const selectedConfig = $('selectedConfig');
    selectedConfig.textContent = `選択された設定: ${fileName}`;

    if (config.title) {
        document.title = `${config.title} | Train Info LCD Menu`;
    }

    if (Array.isArray(config.types) && config.types.length > 0 && !selectedType) {
        selectedType = config.types[0];
        if (typeSelect) {
            typeSelect.value = selectedType.id;
        }
    }
    setPauseButtonEnabled(false);
}

function parseNumeric(value, fallback) {
    const number = Number(String(value).trim());
    return Number.isFinite(number) && number > 0 ? number : fallback;
}

function normalizePagePath(rawPath) {
    if (!rawPath || typeof rawPath !== 'string') {
        return null;
    }
    let path = rawPath.trim().replace(/\\/g, '/');
    if (path.startsWith('./')) {
        path = path.slice(2);
    }
    if (path.startsWith('.')) {
        path = path.slice(1);
    }
    if (!path.startsWith('config/') && !path.startsWith('/')) {
        path = `config/${path}`;
    }
    return path;
}

function createFrame(id, src, height) {
    const frame = document.createElement('iframe');
    frame.id = id;
    frame.src = src;
    frame.title = id;
    frame.style.height = `${height}px`;
    frame.setAttribute('scrolling', 'no');
    frame.setAttribute('seamless', '');
    frame.style.overflow = 'hidden';
    frame.onload = () => {
        try {
            const doc = frame.contentDocument || frame.contentWindow?.document;
            if (doc) {
                doc.documentElement.style.overflow = 'hidden';
                doc.body.style.overflow = 'hidden';
            }
        } catch (error) {
            // ignore cross-origin or unsupported cases
        }
        sendStationDataToFrames();
    };
    return frame;
}

// function sendStationDataToFrame(frame) {
//     if (!frame.contentWindow || !stationState) {
//         return;
//     }
//     frame.contentWindow.postMessage({
//         type: 'stationUpdate',
//         stationState,
//         config: configState,
//         selectedType
//     }, window.location.origin);
// }

function sendStationDataToFrames() {
    if (!popupWindow || popupWindow.closed) {
        return;
    }
    if (!popupReady) {
        return;
    }
    popupWindow.postMessage({
        type: 'stationUpdate',
        stationState,
        config: configState,
        selectedType,
        stationList,
        originIndex,
        terminalIndex,
        currentIndex,
        currentStatus
    }, window.location.origin);
}

function openBlankPopup() {
    const features = 'toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=yes,width=900,height=700';
    popupWindow = window.open('', '_blank', features);
    if (popupWindow) {
        popupWindow.document.open();
        popupWindow.document.write('<!DOCTYPE html><html><head><title>LCD Display</title><meta charset="UTF-8"></head><body style="margin:0;padding:0;font-family:sans-serif;">読み込み中...</body></html>');
        popupWindow.document.close();
    }
}

function openPopupWindow(config, fileName) {
    if (!popupWindow || popupWindow.closed) {
        openBlankPopup();
    }
    if (!popupWindow) {
        return;
    }

    const width = parseNumeric(config.width, 1920);
    const height = parseNumeric(config.height, 1080);
    const mainPageHeight = parseNumeric(config.main_page_height, Math.floor(height * 0.35));
    const infoPageHeight = Math.max(height - mainPageHeight, 0);

    const mainPagePath = normalizePagePath(config.main_page);
    const infoPages = Array.isArray(config.info_page) ? config.info_page : [config.info_page];
    const firstInfoPage = infoPages.filter(Boolean)[0];
    const infoPagePath = firstInfoPage ? normalizePagePath(firstInfoPage) : null;

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${config.title || 'LCD Display'}</title>
<style>
    html, body { margin:0; padding:0; height:100%; overflow:hidden; background:#000; }
    body { display:flex; align-items:center; justify-content:center; }
    #viewport { width:${width}px; height:${height}px; transform-origin:center center; }
    #viewArea { width:100%; height:100%; display:flex; flex-direction:column; }
    iframe { width:100%; border:none; margin:0; padding:0; overflow:hidden; }
</style>
</head>
<body>
<div id="viewport">
    <div id="viewArea">
        ${mainPagePath ? `<iframe src="${mainPagePath}" title="main_page" style="height:${mainPageHeight}px;" scrolling="no"></iframe>` : ''}
        ${infoPagePath ? `<iframe src="${infoPagePath}" title="info_page" style="height:${infoPageHeight}px;" scrolling="no"></iframe>` : ''}
    </div>
</div>
<script>
(function() {
    const viewport = document.getElementById('viewport');
    const targetWidth = ${width};
    const targetHeight = ${height};
    function updateScale() {
        const scaleX = window.innerWidth / targetWidth;
        const scaleY = window.innerHeight / targetHeight;
        const scale = Math.min(scaleX, scaleY);
        viewport.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
        viewport.style.position = 'absolute';
        viewport.style.left = '50%';
        viewport.style.top = '50%';
    }
    window.addEventListener('resize', updateScale);
    updateScale();
    let lastStationUpdate = null;
    let lastControlMessage = null;
    function forwardToFrames(message) {
        const frames = document.querySelectorAll('iframe');
        frames.forEach(function(frame) {
            if (frame.contentWindow) {
                frame.contentWindow.postMessage(message, window.location.origin);
            }
        });
    }
    window.addEventListener('message', function(event) {
        if (event.origin !== window.location.origin) return;
        const message = event.data;
        if (!message || !['stationUpdate', 'pauseUpdate', 'resumeUpdate'].includes(message.type)) return;
        if (message.type === 'stationUpdate') {
            lastStationUpdate = message;
        } else {
            lastControlMessage = message;
        }
        forwardToFrames(message);
    });
    window.addEventListener('DOMContentLoaded', function() {
        const frames = document.querySelectorAll('iframe');
        frames.forEach(function(frame) {
            frame.addEventListener('load', function() {
                if (lastStationUpdate && frame.contentWindow) {
                    frame.contentWindow.postMessage(lastStationUpdate, window.location.origin);
                }
                if (lastControlMessage && frame.contentWindow) {
                    frame.contentWindow.postMessage(lastControlMessage, window.location.origin);
                }
            });
        });
        if (window.opener) {
            window.opener.postMessage({ type: 'popupLoaded' }, window.location.origin);
        }
    });
})();
</script>
</body>
</html>`;

    try {
        popupWindow.document.open();
        popupWindow.document.write(html);
        popupWindow.document.close();
    } catch (error) {
        console.error('Failed to write popup HTML:', error);
    }
}

function setStatus(message, isError) {
    const status = $('status');
    status.textContent = message;
    status.style.color = isError ? '#b91c1c' : '#334155';
}
