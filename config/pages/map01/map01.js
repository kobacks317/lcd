var message = null;
var direction = 1;
let displayTimer = null;
let displayPhase = 0;
let isPaused = false;
let intervalMs = 3000*4;

function updateStationInfo(message) {
    // Update CSS variables
    document.documentElement.style.setProperty('--config-color', message.config.color);
    document.documentElement.style.setProperty('--type-background', message.selectedType.background);
    document.documentElement.style.setProperty('--type-color', message.selectedType.color);

    let dmcIds = ['dmc-01', 'dmc-02', 'dmc-03', 'dmc-04', 'dmc-05', 'dmc-06', 'dmc-07', 'dmc-08'];
    let dmcStationsIndexes = [];
    let dmcStationsStatuses = []; // greyed, current, next, stop, pass, passed
    let stationIndexes = [];
    if (message.originIndex < message.terminalIndex) {
        direction = 1;
        stationIndexes = Array.from({ length: message.stationList.length }, (_, i) => 0 + i);
    } else {
        direction = -1;
        stationIndexes = Array.from({ length: message.stationList.length }, (_, i) => message.stationList.length -1 - i);
    }
    
    // 1駅目を仮設定
    if (message.currentStatus <= 1) {
        dmcStationsIndexes[0] = stationIndexes[stationIndexes.indexOf(message.currentIndex) - 1];
    } else {
        dmcStationsIndexes[0] = stationIndexes[stationIndexes.indexOf(message.currentIndex)];
    }

    // 8駅目の判定し1駅目を修正
    if (stationIndexes.indexOf(dmcStationsIndexes[0])+dmcIds.length> stationIndexes.indexOf(message.terminalIndex)) {
        // 8駅目が終点以降の場合、終点-7駅目を1駅目候補とする
        let newIdx0 = stationIndexes.indexOf(message.terminalIndex) - (dmcIds.length - 1);
        if (stationIndexes.indexOf(newIdx0) >= stationIndexes.indexOf(message.originIndex)) {
            // 1駅目候補が始発以降であれば採用
            dmcStationsIndexes[0] = stationIndexes[newIdx0];
        } else {
            // 1駅目候補が始発以前であれば、始発駅を1駅目とする
            dmcStationsIndexes[0] = message.originIndex;
        }
    }


    for (let i = 1; i < dmcIds.length; i++) {
        let idx = -1;
        let lastIdx = dmcStationsIndexes[i - 1];
        if (lastIdx >= 0) { 
            let si_idx = stationIndexes.indexOf(lastIdx) + 1;
            if (si_idx >= 0 && si_idx < stationIndexes.length) {
                // stationList範囲内
                idx = stationIndexes[si_idx];
                if (idx*direction < message.originIndex*direction || idx*direction > message.terminalIndex*direction) {
                    // 始発以降、終点以前でない
                    idx = -1;
                } else {
                    // 問題なし
                }
            } // elseはstationList外
        } // elseは前駅がすでに-1
        dmcStationsIndexes[i] = idx;
    }

    console.log(dmcStationsIndexes, dmcStationsStatuses);

    for (let i = 0; i < dmcStationsIndexes.length; i++) {
        let dmcStaIdx = dmcStationsIndexes[i];
        if (dmcStaIdx < 0 || stationIndexes.indexOf(dmcStaIdx) < stationIndexes.indexOf(message.originIndex) || stationIndexes.indexOf(dmcStaIdx) > stationIndexes.indexOf(message.terminalIndex)) {
            dmcStationsStatuses[i] = 'greyed';
        } else if (stationIndexes.indexOf(dmcStaIdx) < stationIndexes.indexOf(message.currentIndex)) {
            if (message.stationList[dmcStaIdx][message.selectedType.id] == '') {
                dmcStationsStatuses[i] = 'passed';
            } else {
                dmcStationsStatuses[i] = 'greyed';
            }
        } else if (stationIndexes.indexOf(dmcStaIdx) == stationIndexes.indexOf(message.currentIndex)) {
            if (message.currentStatus <= 1) {
                dmcStationsStatuses[i] = 'next';
            } else {
                dmcStationsStatuses[i] = 'current';
            }
        } else {
            if (message.stationList[dmcStaIdx][message.selectedType.id] == '') {
                dmcStationsStatuses[i] = 'pass';
            } else {
                dmcStationsStatuses[i] = 'stop';
            }
        }
    }

    // currentが通過駅の場合
    if (message.stationList[message.currentIndex][message.selectedType.id] == '') {
        dmcStationsStatuses[dmcStationsStatuses.indexOf('next')] = 'pass';
        dmcStationsStatuses[dmcStationsStatuses.indexOf('stop')] = 'next';
    }

    // 所要時間計算
    let lastTime;
    let lastStopIdx;
    if (message.currentStatus >= 2) {
        lastStopIdx = message.currentIndex;
    } else {
        lastStopIdx = message.currentIndex - direction;
    }
    while (message.stationList[lastStopIdx][message.selectedType.id] == '') {
        lastStopIdx -= direction;
        if (lastStopIdx < 0 || lastStopIdx >= message.stationList.length) {
            break;
        }
    }
    lastTime = message.stationList[lastStopIdx][message.selectedType.id];

    // 駅名配置
    for (let i = 0; i < dmcIds.length; i++) {
        if (dmcStationsIndexes[i] < 0) {
            updateDMC(document.getElementById(dmcIds[i]), null);
        } else {
            let station = message.stationList[dmcStationsIndexes[i]];
            // 通過駅・所要時間設定
            station.status = dmcStationsStatuses[i];
            if (station.status === 'next' || station.status === 'stop') {
                if (direction > 0) {
                    station.time = String(Number(station[message.selectedType.id]) - Number(lastTime));
                } else {
                    station.time = String(Number(lastTime) - Number(station[message.selectedType.id]));
                }
            } else {
                station.time = null;
            }
            // 現在地マーカ設定
            if (dmcStationsIndexes[i] === message.currentIndex) {
                if (message.currentStatus <= 1) {
                    station.marker = 'running';
                } else {
                    station.marker = 'stopping';
                }
            } else {
                station.marker = null;
            }

            // ライン形状を設定
            station.lineShape = ''
            if (i == 0) {
                station.lineShape += ' left-edge';
            } else if (i == dmcIds.length-1) {
                station.lineShape += ' right-edge';
            }

            if (stationIndexes.indexOf(dmcStationsIndexes[i]) == 0) {
                station.lineShape += ' terminal-start';
            } else if (stationIndexes.indexOf(dmcStationsIndexes[i]) == stationIndexes.length-1) {
                station.lineShape += ' terminal-end';
            } else if (dmcStationsIndexes[i] == message.originIndex) {
                station.lineShape += ' start';
            } else if (dmcStationsIndexes[i] == message.terminalIndex) {
                station.lineShape += ' end';
            } else if (i == dmcIds.length-1) {
                station.lineShape += ' continue';
            }
            if (i < dmcIds.length-1 && Math.abs(dmcStationsIndexes[i]-dmcStationsIndexes[i+1]) > 1 && dmcStationsIndexes[i]>=0 && dmcStationsIndexes[i+1]>0) {
                station.lineShape += ' omit-start';
            }
            if (i > 0 && Math.abs(dmcStationsIndexes[i]-dmcStationsIndexes[i-1]) > 1 && dmcStationsIndexes[i]>=0 && dmcStationsIndexes[i-1]>0) {
                station.lineShape += ' omit-end';
            }
            updateDMC(document.getElementById(dmcIds[i]), station);
        }
    }

    intervalMs = Number(message.config?.interval) > 0 ? Number(message.config?.interval*4) : intervalMs;
    setPauseState(isPaused);
}


function getLetterClassV(charCount) {
    if (charCount === 2) return 'v-letter-2';
    if (charCount === 3) return 'v-letter-3';
    if (charCount === 4) return 'v-letter-4';
    if (charCount === 5) return 'v-letter-5';
    if (charCount === 6) return 'v-letter-6';
    if (charCount === 7) return 'v-letter-7';
    if (charCount === 99) return 'v-letter-7';
    return 'no-letter-adjustment';
}

function updateDMC(el, station) {
    el.getElementsByClassName('dmc-sta-name en')[0].style.letterSpacing = 'unset';
    el.getElementsByClassName('dmc-sta-name en')[0].style.transform = 'unset';
    el.getElementsByClassName('dmc-sta-name jp')[0].className = 'dmc-sta-name jp';
    el.getElementsByClassName('dmc-sta-name en')[0].className = 'dmc-sta-name en';
    el.getElementsByClassName('dmc-line left')[0].className = 'dmc-line left';
    el.getElementsByClassName('dmc-line right')[0].className = 'dmc-line right';
    el.getElementsByClassName('dmc-circle')[0].className = 'dmc-circle';
    el.getElementsByClassName('marker-border')[0].className = 'marker-border';
    el.getElementsByClassName('marker-main')[0].className = 'marker-main';

    if (station == null) {
        el.className = 'dmc blank';
        return;
    }
    el.className = 'dmc';
    el.getElementsByClassName('dmc-sta-name jp')[0].textContent = station.jp;
    el.getElementsByClassName('dmc-sta-name en')[0].textContent = station.en;
    el.getElementsByClassName('dmc-numbering-line-code')[0].textContent = station.linecode;
    el.getElementsByClassName('dmc-numbering-sta-number')[0].textContent = station.stanumber.padStart(2, '0');

    // 駅名の文字数に応じたクラスを追加             
    if (station.jp.length <= 7) {
        el.getElementsByClassName('dmc-sta-name jp')[0].classList.add(getLetterClassV(station.jp.length));
    }
    var sw = el.getElementsByClassName('dmc-sta-name en')[0].scrollWidth;
    var tw = 340;
    var lc = station.en.length;
    if (sw <= tw) {
        // 文字が収まっている場合は何もしない
    } else {
        if (station.en.includes('-') && sw > 470) {
            el.getElementsByClassName('dmc-sta-name en')[0].textContent = station.en.replace('-', '-\n');
            el.getElementsByClassName('dmc-sta-name en')[0].classList.add('two-row');
            sw = el.getElementsByClassName('dmc-sta-name en')[0].scrollWidth;
            let rows = el.getElementsByClassName('dmc-sta-name en')[0].textContent.split('\n');
            lc = Math.max(rows[0].length, rows[1].length);
            sw = el.getElementsByClassName('dmc-sta-name en')[0].scrollWidth;
        }
        if (sw > tw) {
            var ls = (sw-tw)/(lc-1);
            if (ls <= 5) {
                el.getElementsByClassName('dmc-sta-name en')[0].style.letterSpacing = -ls + 'px';
            } else {
                el.getElementsByClassName('dmc-sta-name en')[0].style.letterSpacing = '-5px';
                sw = el.getElementsByClassName('dmc-sta-name en')[0].scrollWidth;
                sx = tw/sw;
                el.getElementsByClassName('dmc-sta-name en')[0].style.transform = `scaleX(${sx})`;
            }
        }
    }

    console.log(el.getElementsByClassName('dmc-sta-name en')[0].scrollWidth);


    if (station.status === 'greyed') {
        el.getElementsByClassName('dmc-line left')[0].classList.add('grey');
        el.getElementsByClassName('dmc-line right')[0].classList.add('grey');
        el.getElementsByClassName('dmc-circle')[0].classList.add('grey');
        el.getElementsByClassName('dmc-sta-name')[0].classList.add('grey');
        el.getElementsByClassName('dmc-sta-name')[1].classList.add('grey');
    } else if (station.status === 'passed') {
        el.getElementsByClassName('dmc-line left')[0].classList.add('grey');
        el.getElementsByClassName('dmc-line right')[0].classList.add('grey');
        el.getElementsByClassName('dmc-circle')[0].classList.add('passed');
        el.getElementsByClassName('dmc-sta-name')[0].classList.add('grey');
        el.getElementsByClassName('dmc-sta-name')[1].classList.add('grey');
    } else if (station.status === 'current') {
        el.getElementsByClassName('dmc-line left')[0].classList.add('grey');
        el.getElementsByClassName('dmc-circle')[0].classList.add('now');
    } else if (station.status === 'next') {
        el.getElementsByClassName('dmc-circle')[0].classList.add('next');
    } else if (station.status === 'pass') {
        el.getElementsByClassName('dmc-circle')[0].classList.add('pass');
        el.getElementsByClassName('dmc-sta-name')[0].classList.add('grey');
        el.getElementsByClassName('dmc-sta-name')[1].classList.add('grey');
    }
    
    el.getElementsByClassName('dmc-line left')[0].classList += station.lineShape;
    el.getElementsByClassName('dmc-line right')[0].classList += station.lineShape;

    el.getElementsByClassName('dmc-circle')[0].textContent = station.time;

    if (station.marker === 'running') {
        el.getElementsByClassName('marker-border')[0].className = 'marker-border running';
        el.getElementsByClassName('marker-main')[0].className = 'marker-main running';
    } else if (station.marker === 'stopping') {
        el.getElementsByClassName('marker-border')[0].className = 'marker-border stopping';
        el.getElementsByClassName('marker-main')[0].className = 'marker-main stopping';
    }
}

function showPhase(displayPhase) {
    if (displayPhase == 0) {
        document.documentElement.style.setProperty('--jp-opacity', '1');
        document.documentElement.style.setProperty('--en-opacity', '0');
    } else if (displayPhase == 1) {
        document.documentElement.style.setProperty('--jp-opacity', '0');
        document.documentElement.style.setProperty('--en-opacity', '1');
    }
}



function startDisplayTimer(intervalMs) {
    stopDisplayTimer();
    displayTimer = setInterval(() => {
        displayPhase = (displayPhase + 1) % 2; // 0: jp, 1: en
        showPhase(displayPhase);
    }, intervalMs);
}

function stopDisplayTimer() {
    if (displayTimer) {
        clearInterval(displayTimer);
        displayTimer = null;
    }
}

function setPauseState(paused) {
    isPaused = paused;
    if (paused) {
        stopDisplayTimer();
    } else {
        startDisplayTimer(intervalMs);
    }
}



window.addEventListener('message', (event) => {
    console.log('Received message:', event.data);
    if (event.origin !== window.location.origin) {
        return;
    }
    message = event.data;
    if (!message || !['stationUpdate', 'pauseUpdate', 'resumeUpdate'].includes(message.type)) {
        return;
    }
    if (message.type === 'stationUpdate') {
        try {
            updateStationInfo(message);
        } catch (error) {
            alert(error);
        }
    } else if (message.type === 'pauseUpdate') {
        setPauseState(true);
    } else if (message.type === 'resumeUpdate') {
        setPauseState(false);
    }
});