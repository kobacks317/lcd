let displayTimer = null;
let displayPhase = 0;
let isPaused = false;
let lastStationMessage = null;
var message = null;

function getLetterClass(charCount) {
    if (charCount === 2) return 'letter-2';
    if (charCount === 3) return 'letter-3';
    if (charCount === 5) return 'letter-5';
    if (charCount === 6) return 'letter-6';
    if (charCount === 7) return 'letter-7';
    if (charCount === 99) return 'letter-7';
    return 'no-letter-adjustment';
}

function getLetterClassIn5(charCount) {
    if (charCount === 2) return 'letter-2-in-5';
    if (charCount === 3) return 'letter-3-in-5';
    if (charCount === 4) return 'letter-4-in-5';
    if (charCount === 6) return 'letter-6-in-5';
    if (charCount === 7) return 'letter-7-in-5';
    if (charCount === 99) return 'letter-7-in-5';
    return 'no-letter-adjustment';
}



// function getDisplayPhases(message) {
//     const terminal = message.stationList[message.terminalIndex] || {};
//     const current = message.stationList[message.currentIndex] || {};
//     const phases = [
//         { destinationLang: 'jp', currentLang: 'jp', english: false }
//     ];
//     if (terminal.en && current.en) {
//         phases.push({ destinationLang: 'en', currentLang: 'en', english: true });
//     }
//     if (current.kana) {
//         phases.push({ destinationLang: 'jp', currentLang: 'kana', english: false });
//     }
//     return phases;
// }

// function hideAllPhases() {
//     const phaseIds = [
//         'destination-jp', 'destination-en',
//         'staName-jp', 'staName-en', 'staName-kana',
//         'status-jp', 'status-en'
//     ];
//     phaseIds.forEach(id => {
//         const el = document.getElementById(id);
//         if (el) el.style.display = 'none';
//     });
// }

function showPhase(displayPhase) {
    if (displayPhase == 0) {
        document.documentElement.style.setProperty('--jp-opacity', '1');
        document.documentElement.style.setProperty('--en-opacity', '0');
        document.documentElement.style.setProperty('--kana-opacity', '0');
    } else if (displayPhase == 1) {
        document.documentElement.style.setProperty('--jp-opacity', '0');
        document.documentElement.style.setProperty('--en-opacity', '1');
        document.documentElement.style.setProperty('--kana-opacity', '0');
    } else if (displayPhase == 2) {
        document.documentElement.style.setProperty('--jp-opacity', '0');
        document.documentElement.style.setProperty('--en-opacity', '0');
        document.documentElement.style.setProperty('--kana-opacity', '1');
    }
}

function updateStationInfo(message) {
    // const configColor = message.config?.color || '#ff0000';
    // const selectedType = message.selectedType || {};
    // const terminal = message.stationList[message.terminalIndex] || {};
    // const current = message.stationList[message.currentIndex] || {};
    // const currentNumberRaw = current.stanumber || current.staNo || '';
    // const currentNumber = currentNumberRaw ? String(currentNumberRaw).padStart(2, '0') : '';
    // const lineCode = current.linecode || current.lineCode || '';
    // const typeColor = selectedType.color || '#000000';
    // const typeBackground = selectedType.background || '#ffffff';

    // const phases = getDisplayPhases(message);
    // if (phases.length === 0) {
    //     return;
    // }
    // displayPhases = phases;

    // Update CSS variables
    document.documentElement.style.setProperty('--config-color', message.config.color);
    document.documentElement.style.setProperty('--type-background', message.selectedType.background);
    document.documentElement.style.setProperty('--type-color', message.selectedType.color);

    // Update text content
    document.getElementById('type-jp').textContent = message.selectedType.name;
    document.getElementById('type-en').textContent = message.selectedType.name_en;
    
    document.getElementById('sta-code').textContent = message.stationList[message.currentIndex].stacode;
    document.getElementById('line-code').textContent = message.stationList[message.currentIndex].linecode;
    document.getElementById('sta-number').textContent = message.stationList[message.currentIndex].stanumber.padStart(2, '0');
    
    document.getElementById('destination-jp').textContent = message.stationList[message.terminalIndex].jp;
    document.getElementById('destination-en').textContent = message.stationList[message.terminalIndex].en;

    document.getElementById('sta-name-jp').textContent = message.stationList[message.currentIndex].jp;
    document.getElementById('sta-name-en').textContent = message.stationList[message.currentIndex].en;
    document.getElementById('sta-name-kana').textContent = message.stationList[message.currentIndex].kana;
    
    // classの更新は内容の更新後に行う
    document.getElementById('type-jp').className = 'type jp kana';
    document.getElementById('type-en').className = 'type en';
    
    if (message.stationList[message.currentIndex].stacode === '') {
        document.getElementById('numbering-box').className = '';
    } else {
        document.getElementById('numbering-box').className = 'with-sta-code';
    }
    document.getElementById('line-code').className = 'numbering';
    document.getElementById('sta-number').className = 'numbering';
    
    document.getElementById('destination-jp').className = 'destination name jp kana';
    document.getElementById('destination-en').className = 'destination name en';

    document.getElementById('sta-name-jp').className = 'sta name jp';
    document.getElementById('sta-name-en').className = 'sta name en';
    document.getElementById('sta-name-kana').className = 'sta name kana';

    // 文字数に応じたクラスの追加やスタイルの調整
    var sw, cw, ls;
    if (message.stationList[message.terminalIndex].jp.length <= 7) {
        document.getElementById('destination-jp').style.letterSpacing = null;
        document.getElementById('destination-jp').style.transform = null;
        document.getElementById('destination-jp').classList.add(getLetterClassIn5(message.stationList[message.terminalIndex].jp.length));
    } else {
        document.getElementById('destination-jp').style.letterSpacing = '-0.12em';
        sw = document.getElementById('destination-jp').scrollWidth;
        cw = document.getElementById('type-box').clientWidth;
        document.getElementById('destination-jp').style.transform = `scaleX(calc(${cw} / ${sw}))`;
    }

    if (message.stationList[message.currentIndex].jp.length <= 7) {
        document.getElementById('sta-name-jp').style.letterSpacing = null;
        document.getElementById('sta-name-jp').style.transform = null;
        document.getElementById('sta-name-jp').classList.add(getLetterClass(message.stationList[message.currentIndex].jp.length));
    } else {
        document.getElementById('sta-name-jp').style.letterSpacing = '-0.12em';
        sw = document.getElementById('sta-name-jp').scrollWidth;
        cw = document.getElementById('sta-field').clientWidth;
        document.getElementById('sta-name-jp').style.transform = `scaleX(calc(${cw} / ${sw}))`;
    }

    if (message.stationList[message.currentIndex].kana.length <= 7) {
        document.getElementById('sta-name-kana').style.letterSpacing = null;
        document.getElementById('sta-name-kana').style.transform = null;
        document.getElementById('sta-name-kana').classList.add(getLetterClass(message.stationList[message.currentIndex].kana.length));
    } else {
        document.getElementById('sta-name-kana').style.letterSpacing = '-0.12em';
        sw = document.getElementById('sta-name-kana').scrollWidth;
        cw = document.getElementById('sta-field').clientWidth;
        document.getElementById('sta-name-kana').style.transform = `scaleX(calc(${cw} / ${sw}))`;
    }
    
    document.getElementById('destination-en').style.letterSpacing = null;
    document.getElementById('destination-en').style.transform = null;
    sw = document.getElementById('destination-en').scrollWidth;
    cw = document.getElementById('type-box').clientWidth;
    if (sw > cw) {
        ls = (sw - cw) / (message.stationList[message.terminalIndex].en.length - 1);
        if (ls <= 6) {
            document.getElementById('destination-en').style.letterSpacing = `${-ls}px`;
        } else {
            document.getElementById('destination-en').style.letterSpacing = `${-6}px`;
            sw = document.getElementById('destination-en').scrollWidth;
            document.getElementById('destination-en').style.transform = `scaleX(calc(${cw} / ${sw}))`;
        }
    }

    document.getElementById('sta-name-en').style.letterSpacing = null;
    document.getElementById('sta-name-en').style.transform = null;
    sw = document.getElementById('sta-name-en').scrollWidth;
    cw = document.getElementById('sta-field').clientWidth;
    if (sw > cw) {
        document.getElementById('sta-name-en').style.justifySelf = null;
        ls = (sw - cw) / (message.stationList[message.currentIndex].en.length - 1);
        if (ls <= 20) {
            document.getElementById('sta-name-en').style.letterSpacing = `${-ls}px`;
        } else {
            document.getElementById('sta-name-en').style.letterSpacing = `${-20}px`;
            sw = document.getElementById('sta-name-en').scrollWidth;
            document.getElementById('sta-name-en').style.transform = `scaleX(calc(${cw} / ${sw}))`;
        }
    } else {
        document.getElementById('sta-name-en').style.justifySelf = 'center';
    }


    const intervalMs = Number(message.config?.interval) > 0 ? Number(message.config?.interval) : 3000;
    if (displayTimer) {
        clearInterval(displayTimer);
        displayTimer = null;
    }
    if (!isPaused) {
        startDisplayTimer(intervalMs);
    }
}

function startDisplayTimer(intervalMs) {
    stopDisplayTimer();
    displayTimer = setInterval(() => {
        displayPhase = (displayPhase + 1) % 3; // 0: jp, 1: en, 2: kana
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
    } else if (displayPhases.length > 1 && lastStationMessage) {
        const intervalMs = Number(lastStationMessage.config?.interval) > 0 ? Number(lastStationMessage.config?.interval) : 3000;
        startDisplayTimer(intervalMs);
    }
}


window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) {
        return;
    }
    message = event.data;
    if (!message || !['stationUpdate', 'pauseUpdate', 'resumeUpdate'].includes(message.type)) {
        return;
    }
    if (message.type === 'stationUpdate') {
        updateStationInfo(message);
    } else if (message.type === 'pauseUpdate') {
        setPauseState(true);
    } else if (message.type === 'resumeUpdate') {
        setPauseState(false);
    }
});

window.addEventListener('DOMContentLoaded', () => {
    // main page will receive station updates from parent when ready.
});

window.stopDisplayTimer = stopDisplayTimer;