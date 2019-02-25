/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const myOptionsManager = new OptionsManager();

function createOptions(options) {
    updateEventsTable(options.events);
    updateSequencesTable(options.sequences);
}

function updateEventsTable(events) {
    let model = document.getElementById("model_event");
    let table = document.getElementById("events");
    for (let event of events) {
        let option = model.cloneNode(true);

        option.querySelector(".button").value = event.button;
        option.querySelector(".type").value = event.type;
        option.querySelector(".command").value = event.command;

        for (let input of option.querySelectorAll(".buttons_down input")) {
            input.checked = event.buttonsDown.includes(input.value);
        }

        function setButtonDisabled(type) {
            let button = option.querySelector(".button");
            if (type === TYPE_SCROLL_UP || type === TYPE_SCROLL_DOWN) {
                button.value = -1;
                button.disabled = true;
            } else {
                button.disabled = false;
            }
        }

        setButtonDisabled(event.type);

        option.querySelector(".type").addEventListener("change", function () {
            setButtonDisabled(this.value);
        });
        option.querySelector(".remove").addEventListener("click", function () {
            table.removeChild(option);
            saveEvents();
        });
        option.removeAttribute("id");
        table.appendChild(option);
    }
}

function updateSequencesTable(sequences) {
    let model = document.getElementById("model_sequence");
    let table = document.getElementById("sequences");
    for (let s of sequences) {
        let option = model.cloneNode(true);
        option.querySelector(".sequence").textContent = translateSequence(s.sequence);
        option.querySelector(".sequence").value = s.sequence;
        option.querySelector(".command").value = s.command;
        option.querySelector(".remove").addEventListener("click", function () {
            table.removeChild(option);
            saveSequences();
        });
        option.removeAttribute("id");
        table.appendChild(option);
    }
}

function saveEvents() {
    let options = document.querySelectorAll("#events > tr");
    let events = [];
    for (let option of options) {
        events.push({
            "type": option.querySelector(".type").value,
            "button": option.querySelector(".button").value,
            "buttonsDown": Array.from(option.querySelectorAll(".buttons_down input:checked")).map(input => input.value),
            "command": option.querySelector(".command").value
        });
    }
    myOptionsManager.saveOption("events", events);
}

function saveSequences() {
    let options = document.querySelectorAll("#sequences > tr");
    let sequences = [];
    for (let option of options) {
        sequences.push({
            "sequence": option.querySelector(".sequence").value,
            "command": option.querySelector(".command").value
        });
    }
    myOptionsManager.saveOption("sequences", sequences);
}

function loadCommands() {
    for (let select of document.querySelectorAll(".command")) {
        for (let command of Object.keys(commands)) {
            let option = document.createElement("option");
            option.value = command;
            option.dataset.i18n = "command_" + command;
            select.appendChild(option);
        }
        translateDocument(select);
    }
}

function testMouseEvent(e) {
    let event = e.detail;
    if (nextEventToSkip && nextEventToSkip.button === event.button && nextEventToSkip.type === event.type) {
        nextEventToSkip = null;
        return;
    }
    let debug = document.getElementById("event_debug");
    if (debug.classList.contains("matches"))
        return;
    debug.textContent = event.translate();

    if (event.type === LongPress) {
        nextEventToSkip = {button: event.button, type: MouseUp};
    }
    if (!myOptionsManager.options.events) return;
    for (let option of myOptionsManager.options.events) {
        if (event.type === option.type && event.button === option.button && event.buttonsDown === option.buttonsDown) {
            debug.textContent += " = " + browser.i18n.getMessage("command_" + option.command);
            debug.classList.toggle("matches", true);
            setTimeout(function () {
                debug.classList.remove("matches");
            }, 2000);
        }
    }
}

function resetEventSequence() {
    recordedSequence = eventSequence;
    eventSequence = new MouseEventSequence();
}

function recordSequence(e) {
    clearTimeout(resetSequenceTimer);
    let event = e.detail;
    if (nextEventToSkip && nextEventToSkip.button === event.button && nextEventToSkip.type === event.type) {
        nextEventToSkip = null;
        resetEventSequence();
        return;
    }
    let debug = document.getElementById("sequence_debug");
    if (debug.classList.contains("matches"))
        return;
    eventSequence.add(event);
    debug.textContent = eventSequence.translate();
    if (event.type === LongPress) {
        nextEventToSkip = {button: event.button, type: MouseUp};
    }
    resetSequenceTimer = setTimeout(resetEventSequence, 350);
    if (!myOptionsManager.options.sequences) return;
    for (let option of myOptionsManager.options.sequences) {
        let s = new MouseEventSequence();
        s.parseFromString(option.sequence);
        if (eventSequence.equals(s)) {
            debug.textContent += " = " + browser.i18n.getMessage("command_" + option.command);
            debug.classList.toggle("matches", true);
            setTimeout(function () {
                debug.classList.remove("matches");
            }, 2000);
        }
    }
}

document.addEventListener("DOMContentLoaded", function () {
    loadCommands();
    myOptionsManager.loadOptions().then(() => {
        if (!myOptionsManager.options.events) {
            myOptionsManager.loadDefaultOptions().then(createOptions);
        } else {
            createOptions(myOptionsManager.options);
        }
    });
    document.getElementById("add_new_event").addEventListener("click", function () {
        updateEventsTable([{
            "type": TYPE_MOUSE_DOWN,
            "button": BUTTON_PRIMARY,
            "buttonsDown": [],
            "command": ""
        }]);
    });
    document.getElementById("add_recorded_sequence").addEventListener("click", function () {
        updateSequencesTable([{
            "sequence": recordedSequence.toString(),
            "command": ""
        }]);
    });
    document.getElementById("events").addEventListener("change", saveEvents);
    document.getElementById("sequences").addEventListener("change", saveSequences);

    document.getElementById("event_test_area").addEventListener("mousecommmand", testMouseEvent);
    document.getElementById("sequence_record_area").addEventListener("mousecommmand", recordSequence);
});