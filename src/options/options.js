/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const myOptionsManager = new OptionsManager();

const MOUSE_COMMANDER_TEST_MODE = true;

let nextEventToSkip;
let resetSequenceTimer;
let recordedSequence;
let eventSequence = new MouseEventSequence();

function createOptions(options) {
    updateEventsTable(options.events);
    updateSequencesTable(options.sequences);
}

function updateEventsTable(events) {
    let eventModel = document.getElementById("model_event");
    let eventsTable = document.getElementById("events");
    for (let event of events) {
        let option = eventModel.cloneNode(true);
        let button = option.querySelector(".button");

        function setType(type) {
            if (type === WheelUp || type === WheelDown) {
                button.value = -1;
                button.disabled = true;
            } else {
                button.value = event.button;
                button.disabled = false;
            }
        }

        setType(event.type);
        option.querySelector(".type").addEventListener("change", function () {
            let type = parseInt(this.value);
            setType(type);
        });
        option.querySelector(".type").value = event.type;
        option.querySelector(".buttons_down input[value='1']").checked = isOtherButtonDown(1, event);
        option.querySelector(".buttons_down input[value='2']").checked = isOtherButtonDown(2, event);
        option.querySelector(".buttons_down input[value='4']").checked = isOtherButtonDown(4, event);
        option.querySelector(".command").value = event.command;
        option.querySelector(".remove").addEventListener("click", function () {
            eventsTable.removeChild(option);
            saveEvents();
        });
        option.removeAttribute("id");
        eventsTable.appendChild(option);
    }
}

function updateSequencesTable(sequences) {
    let model = document.getElementById("model_sequence");
    let table = document.getElementById("sequences");
    for (let sequence of sequences) {
        let option = model.cloneNode(true);
        let s = new MouseEventSequence();
        s.parseFromString(sequence.sequence);
        option.querySelector(".sequence").textContent = s.translate();
        option.querySelector(".sequence").value = s.toString();
        option.querySelector(".command").value = sequence.command;
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
            "type": parseInt(option.querySelector(".type").value),
            "button": parseInt(getButtonValue(option)),
            "buttonsDown": getButtonsDownValue(option),
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

function getButtonValue(option) {
    let value = option.querySelector(".button").value;
    if (value === "-1")
        return 0;
    return value;
}

function getButtonsDownValue(option) {
    let buttonsDown = 0;
    let type = parseInt(option.querySelector(".type").value);
    let button = parseInt(option.querySelector(".button").value);

    if (option.querySelector(".buttons_down input[value='1']").checked)
        buttonsDown += 1;
    if (option.querySelector(".buttons_down input[value='2']").checked)
        buttonsDown += 2;
    if (option.querySelector(".buttons_down input[value='4']").checked)
        buttonsDown += 4;

    if (type === MouseDown || type === LongPress)
        buttonsDown += ButtonDown[button];

    return buttonsDown;
}

function fillCommands() {
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
    fillCommands();
    myOptionsManager.loadOptions().then(() => {
        if (!myOptionsManager.options.events) {
            myOptionsManager.loadDefaultOptions().then(createOptions);
        } else {
            createOptions(myOptionsManager.options);
        }
    });
    document.getElementById("add_new_event").addEventListener("click", function () {
        updateEventsTable([{
            "type": 1,
            "button": 0,
            "buttonsDown": 0,
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