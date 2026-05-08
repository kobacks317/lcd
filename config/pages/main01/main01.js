let displayTimer = null;
let displayPhase = 0;
let displayPhases = [];

function getLetterClass(charCount) {
    if (charCount === 2) return 'letter-2';
    if (charCount === 3) return 'letter-3';
    if (charCount === 5) return 'letter-5';
    if (charCount === 6) return 'letter-6';
    if (charCount === 7) return 'letter-7';
    return '';
}

function getLetterClassIn5(charCount) {
    if (charCount === 2) return 'letter-2-in-5';
    if (charCount === 3) return 'letter-3-in-5';
    if (charCount === 4) return 'letter-4-in-5';
    if (charCount === 6) return 'letter-6-in-5';
    if (charCount === 7) return 'letter-7-in-5';
    return '';
}

function getDisplayPhases(message) {
    const terminal = message.stationState.terminal || {};
    const current = message.stationState.current || {};
    const phases = [
        { destinationLang: 'jp', currentLang: 'jp', english: false }
    ];
    if (terminal.en && current.en) {
        phases.push({ destinationLang: 'en', currentLang: 'en', english: true });
    }
    if (current.kana) {
        phases.push({ destinationLang: 'jp', currentLang: 'kana', english: false });
    }
    return phases;
}

function hideAllPhases() {
    const phaseIds = [
        'destination-jp', 'destination-en',
        'staName-jp', 'staName-en', 'staName-kana',
        'status-jp', 'status-en'
    ];
    phaseIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

function showPhase(phaseIndex) {
    hideAllPhases();
    const phase = displayPhases[phaseIndex];
    if (!phase) return;

    if (phase.english) {
        document.getElementById('destination-en').style.display = 'block';
        document.getElementById('staName-en').style.display = 'block';
        document.getElementById('status-en').style.display = 'block';
    } else if (phase.currentLang === 'kana') {
        document.getElementById('destination-jp').style.display = 'block';
        document.getElementById('staName-kana').style.display = 'block';
        document.getElementById('status-jp').style.display = 'block';
    } else {
        document.getElementById('destination-jp').style.display = 'block';
        document.getElementById('staName-jp').style.display = 'block';
        document.getElementById('status-jp').style.display = 'block';
    }
}

function updateStationInfo(message) {
    const configColor = message.config?.color || '#ff0000';
    const selectedType = message.selectedType || {};
    const terminal = message.stationState.terminal || {};
    const current = message.stationState.current || {};
    const currentNumberRaw = current.stanumber || current.staNo || '';
    const currentNumber = currentNumberRaw ? String(currentNumberRaw).padStart(2, '0') : '';
    const lineCode = current.linecode || current.lineCode || '';
    const typeColor = selectedType.color || '#000000';
    const typeBackground = selectedType.background || '#ffffff';

    const phases = getDisplayPhases(message);
    if (phases.length === 0) {
        return;
    }
    displayPhases = phases;

    // Update CSS variables
    document.documentElement.style.setProperty('--config-color', configColor);
    document.documentElement.style.setProperty('--type-background', typeBackground);
    document.documentElement.style.setProperty('--type-color', typeColor);

    const arrowEl = document.getElementById('arrow');
    const typeBoxEl = document.getElementById('type-box');
    const typeEl = document.getElementById('type');
    const numberingEl = document.getElementById('nummbering');
    const lineCodeEl = document.getElementById('line-code');
    const staNumberEl = document.getElementById('sta-number');

    if (arrowEl) {
        arrowEl.className = 'arrow';
    }
    if (typeBoxEl) {
        typeBoxEl.className = 'type-box';
    }
    if (typeEl) {
        const typeLabel = selectedType.name || selectedType.name_en || '';
        typeEl.textContent = typeLabel;
        typeEl.className = 'type ' + getLetterClass(typeLabel.length);
    }
    if (numberingEl) {
        numberingEl.className = 'numbering';
    }
    if (lineCodeEl) {
        lineCodeEl.textContent = lineCode || '---';
    }
    if (staNumberEl) {
        staNumberEl.textContent = currentNumber || '---';
        staNumberEl.className = 'numbering-text';
    }

    phases.forEach((phase, index) => {
        const terminalText = phase.destinationLang === 'en' ? terminal.en || terminal.jp || '' : terminal.jp || terminal.en || '';
        const currentText = phase.currentLang === 'en'
            ? current.en || current.jp || ''
            : phase.currentLang === 'kana'
                ? current.kana || current.jp || ''
                : current.jp || current.en || '';

        if (phase.english) {
            const destEnEl = document.getElementById('destination-en-text');
            if (destEnEl) {
                destEnEl.textContent = terminalText;
                destEnEl.className = 'destination-en-text ' + getLetterClassIn5(terminalText.length);
                destEnEl.style.transform = 'none';
            }
            const staEnEl = document.getElementById('staName-en-text');
            if (staEnEl) {
                staEnEl.textContent = currentText;
                staEnEl.className = 'sta-name-en-text ' + getLetterClass(currentText.length);
                staEnEl.style.transform = 'none';
                adjustTextWidth(staEnEl);
            }
        } else if (phase.currentLang === 'kana') {
            const destJpEl = document.getElementById('destination-jp-text');
            if (destJpEl) {
                destJpEl.textContent = terminalText;
                destJpEl.className = 'destination-jp-text ' + getLetterClassIn5(terminalText.length);
                destJpEl.style.transform = 'none';
            }
            const staKanaEl = document.getElementById('staName-kana-text');
            if (staKanaEl) {
                staKanaEl.textContent = currentText;
                staKanaEl.className = 'sta-name-kana-text ' + getLetterClass(currentText.length);
                staKanaEl.style.transform = 'none';
                adjustTextWidth(staKanaEl);
            }
        } else {
            const destJpEl = document.getElementById('destination-jp-text');
            if (destJpEl) {
                destJpEl.textContent = terminalText;
                destJpEl.className = 'destination-jp-text ' + getLetterClassIn5(terminalText.length);
                destJpEl.style.transform = 'none';
            }
            const staJpEl = document.getElementById('staName-jp-text');
            if (staJpEl) {
                staJpEl.textContent = currentText;
                staJpEl.className = 'sta-name-jp-text ' + getLetterClass(currentText.length);
                staJpEl.style.transform = 'none';
                adjustTextWidth(staJpEl);
            }
        }
    });

    displayPhase = 0;
    showPhase(displayPhase);

    const intervalMs = Number(message.config?.interval) > 0 ? Number(message.config?.interval) : 3000;
    if (displayTimer) {
        clearInterval(displayTimer);
    }
    if (displayPhases.length > 1) {
        displayTimer = setInterval(() => {
            displayPhase = (displayPhase + 1) % displayPhases.length;
            showPhase(displayPhase);
        }, intervalMs);
    }
}

function stopDisplayTimer() {
    if (displayTimer) {
        clearInterval(displayTimer);
        displayTimer = null;
    }
}

function adjustTextWidth(el) {
    requestAnimationFrame(() => {
        const availableWidth = el.clientWidth || (el.parentElement?.clientWidth || 1);
        const actualWidth = el.scrollWidth;
        if (actualWidth > availableWidth && availableWidth > 0) {
            const scaleX = availableWidth / actualWidth;
            el.style.transform = `scaleX(${scaleX})`;
            el.style.transformOrigin = 'center center';
        } else {
            el.style.transform = 'none';
        }
    });
}

window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) {
        return;
    }
    const message = event.data;
    if (!message || message.type !== 'stationUpdate') {
        return;
    }
    updateStationInfo(message);
});

window.addEventListener('DOMContentLoaded', () => {
    // main page will receive station updates from parent when ready.
});

window.stopDisplayTimer = stopDisplayTimer;