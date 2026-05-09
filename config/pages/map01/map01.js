var message = null;

function updateStationInfo(message) {
    // Update CSS variables
    document.documentElement.style.setProperty('--config-color', message.config.color);
    document.documentElement.style.setProperty('--type-background', message.selectedType.background);
    document.documentElement.style.setProperty('--type-color', message.selectedType.color);

    let dmcIds = ['dmc-01', 'dmc-02', 'dmc-03', 'dmc-04', 'dmc-05', 'dmc-06', 'dmc-07', 'dmc-08'];
    let dmcStationsIndexes = [];
    let stationIndexes = [];
    if (message.originIndex < message.terminalIndex) {
        stationIndexes = Array.from({ length: message.stationList.length }, (_, i) => 0 + i);
    } else {
        stationIndexes = Array.from({ length: message.stationList.length }, (_, i) => message.stationList.length -1 - i);
    }

    if (stationIndexes.indexOf(message.currentIndex) == 0) {
        dmcStationsIndexes[0] = stationIndexes[0];
    } else if (stationIndexes.indexOf(message.currentIndex) > stationIndexes.length - dmcIds.length) {
        dmcStationsIndexes[0] = stationIndexes[stationIndexes.length - dmcIds.length];
    } else {
        dmcStationsIndexes[0] = stationIndexes[stationIndexes.indexOf(message.currentIndex) - 1];
    }

    for (let i = 1; i < dmcIds.length; i++) {
        dmcStationsIndexes[i] = stationIndexes[stationIndexes.indexOf(dmcStationsIndexes[i - 1]) + 1];
    }

    console.log('Updating DMCs with station indexes:', dmcStationsIndexes);

    for (let i = 0; i < dmcIds.length; i++) {
        let station = message.stationList[dmcStationsIndexes[i]];
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
    el.getElementsByClassName('dmc-numbering-sta-number')[0].textContent = station.stanumber;
    
    el.getElementsByClassName('dmc-sta-name')[0].className = 'dmc-sta-name';
    if (station.jp.length <= 7) {
        el.getElementsByClassName('dmc-sta-name')[0].classList.add(getLetterClassV(station.jp.length));
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
        updateStationInfo(message);
    } else if (message.type === 'pauseUpdate') {
        setPauseState(true);
    } else if (message.type === 'resumeUpdate') {
        setPauseState(false);
    }
});