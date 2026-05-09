var message = null;
var direction = 1;

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

    if (stationIndexes.indexOf(message.currentIndex) == 0) {
        dmcStationsIndexes[0] = stationIndexes[0];
    } else if (stationIndexes.indexOf(message.currentIndex) > stationIndexes.length - dmcIds.length) {
        dmcStationsIndexes[0] = stationIndexes[stationIndexes.length - dmcIds.length];
    } else {
        if (message.currentStatus <= 1) {
            dmcStationsIndexes[0] = stationIndexes[stationIndexes.indexOf(message.currentIndex) - 1];
        } else {
            dmcStationsIndexes[0] = stationIndexes[stationIndexes.indexOf(message.currentIndex)];
        }
    }

    for (let i = 1; i < dmcIds.length; i++) {
        dmcStationsIndexes[i] = stationIndexes[stationIndexes.indexOf(dmcStationsIndexes[i - 1]) + 1];
    }

    for (let i = 0; i < dmcStationsIndexes.length; i++) {
        let dmcStaIdx = dmcStationsIndexes[i];
        if (stationIndexes.indexOf(dmcStaIdx) < stationIndexes.indexOf(message.originIndex) || stationIndexes.indexOf(dmcStaIdx) > stationIndexes.indexOf(message.terminalIndex)) {
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

    console.log('Updating DMCs with station indexes:', dmcStationsIndexes, dmcStationsStatuses);

    for (let i = 0; i < dmcIds.length; i++) {
        let station = message.stationList[dmcStationsIndexes[i]];
        station.status = dmcStationsStatuses[i];
        updateDMC(document.getElementById(dmcIds[i]), station);
    }
}

function setPauseState(isPaused) {
    console.log(`Pause state updated: ${isPaused}`);
}


function getLetterClassV(charCount) {
    if (charCount === 2) return 'v-letter-2';
    if (charCount === 3) return 'v-letter-3';
    if (charCount === 5) return 'v-letter-5';
    if (charCount === 6) return 'v-letter-6';
    if (charCount === 7) return 'v-letter-7';
    if (charCount === 99) return 'v-letter-7';
    return 'no-letter-adjustment';
}

function updateDMC(el, station) {
    el.getElementsByClassName('dmc-sta-name')[0].textContent = station.jp;
    el.getElementsByClassName('dmc-numbering-line-code')[0].textContent = station.linecode;
    el.getElementsByClassName('dmc-numbering-sta-number')[0].textContent = station.stanumber.padStart(2, '0');
    
    el.getElementsByClassName('dmc-sta-name')[0].className = 'dmc-sta-name';
    if (station.jp.length <= 7) {
        el.getElementsByClassName('dmc-sta-name')[0].classList.add(getLetterClassV(station.jp.length));
    }

    el.getElementsByClassName('dmc-line-l')[0].className = 'dmc-line-l';
    el.getElementsByClassName('dmc-line-r')[0].className = 'dmc-line-r';
    el.getElementsByClassName('dmc-circle')[0].className = 'dmc-circle';

    if (station.status === 'greyed') {
        el.getElementsByClassName('dmc-line-l')[0].classList.add('grey');
        el.getElementsByClassName('dmc-line-r')[0].classList.add('grey');
        el.getElementsByClassName('dmc-circle')[0].classList.add('grey');
        el.getElementsByClassName('dmc-sta-name')[0].classList.add('grey');
    } else if (station.status === 'passed') {
        el.getElementsByClassName('dmc-line-l')[0].classList.add('grey');
        el.getElementsByClassName('dmc-line-r')[0].classList.add('grey');
        el.getElementsByClassName('dmc-circle')[0].classList.add('passed');
        el.getElementsByClassName('dmc-sta-name')[0].classList.add('grey');
    } else if (station.status === 'current') {
        el.getElementsByClassName('dmc-line-l')[0].classList.add('grey');
        el.getElementsByClassName('dmc-circle')[0].classList.add('grey');
    } else if (station.status === 'next') {
        el.getElementsByClassName('dmc-circle')[0].classList.add('next');
    } else if (station.status === 'pass') {
        el.getElementsByClassName('dmc-circle')[0].classList.add('pass');
        el.getElementsByClassName('dmc-sta-name')[0].classList.add('grey');
    }
    el.getElementsByClassName('dmc-circle')[0].textContent = "";
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
        updateStationInfo(message);
    } else if (message.type === 'pauseUpdate') {
        setPauseState(true);
    } else if (message.type === 'resumeUpdate') {
        setPauseState(false);
    }
});