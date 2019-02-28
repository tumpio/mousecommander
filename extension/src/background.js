/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

let buttonsDown = 0;
let sequenceTimer = null;
let skipEvents = new Set();
let testPort = null;
let testingEvent = false;
let testingSequence = false;
let testSequence = [];
let sequenceDebugPort = null;
let commandBindings = new CommandBindings();
let sequenceBinder = new SequenceBinder();
let longPressTimer = {
    [PrimaryButton]: null,
    [MiddleButton]: null,
    [SecondaryButton]: null
};

function onLongPress(button) {
    return () => {
        longPressTimer[button] = null;
        onMouseEvent(EventLongPress[button]);
    }
}

const clientPort = browser.runtime.connectNative(CLIENT_NAME);
clientPort.postMessage(MESSAGE_START_SIGNAL);

clientPort.onMessage.addListener(onMouseEvent);
browser.storage.local.get().then(initOptions);
browser.storage.onChanged.addListener(initChangedOptions);

browser.windows.onFocusChanged.addListener((windowId) => {
    if (windowId == browser.windows.WINDOW_ID_NONE) {
        clientPort.onMessage.removeListener(onMouseEvent);
    } else {
        clientPort.onMessage.addListener(onMouseEvent);
    }
});

browser.runtime.onConnect.addListener((port) => {
    testPort = port;
    testingEvent = port.name === "event";
    testingSequence = port.name === "sequence";
    port.onDisconnect.addListener(onDebugDisconnected);
});

function onDebugDisconnected() {
    testPort = null;
    testingEvent = false;
    testingSequence = false;
}

function initOptions(options) {
    initEvents(options["events"]);
    initSequences(options["sequences"]);
}

function initChangedOptions(change) {
    if ("events" in change) {
        initEvents(change["events"].newValue);
    }
    if ("sequences" in change) {
        initSequences(change["sequences"].newValue);
    }
}

function initEvents(events) {
    if (!events) return;
    commandBindings = new CommandBindings();
    for (let option of events) {
        let button = MouseButtonValues[option.button];
        let command = commands[option.command];
        let event = null;
        switch (option.type) {
            case TYPE_MOUSE_UP:
                event = EventMouseUp[button];
                break;
            case TYPE_MOUSE_DOWN:
                event = EventMouseDown[button];
                break;
            case TYPE_SCROLL_UP:
                event = EventScrollUp;
                break;
            case TYPE_SCROLL_DOWN:
                event = EventScrollDown;
                break;
            case TYPE_LONG_PRESS:
                event = EventLongPress[button];
                break;
        }
        commandBindings.bind(event, new CommandBinding(command, getButtonsDownValue(option.buttonsDown)));
    }
}

function initSequences(sequences) {
    if (!sequences) return;
    sequenceBinder = new SequenceBinder();
    for (let option of sequences) {
        sequenceBinder.bind(option.sequence.split(","), commands[option.command]);
    }
}

function onMouseEvent(event) {
    updateButtonsDown(event);
    if (skipEvents.has(event)) {
        skipEvents.delete(event);
        return;
    }
    if (sequenceTimer) {
        clearTimeout(sequenceTimer);
        sequenceTimer = null;
    }
    if (testingEvent) {
        messageTestEvent(event);
    } else if (testingSequence) { 
        messageTestSequence(event);
    } else {
        executeBinding(event);
    }
}

function updateButtonsDown(event) {
    if (event.length !== 3) {
        return;
    }
    let button = event.charAt(2);
    if (event === EventMouseUp[button]) {
        if (longPressTimer[button]) {
            clearTimeout(longPressTimer[button]);
            longPressTimer[button] = null;
        }
        buttonsDown ^= MouseButtonDown[button];
    } else if (event === EventMouseDown[button]) {
        longPressTimer[button] = setTimeout(
            onLongPress(button),
            LONG_PRESS_DURATION
        );
        buttonsDown |= MouseButtonDown[button];
    } else if (event === EventLongPress[button]) {
        skipEvents.add(EventMouseUp[button]);
    }
    for (let [k, v] of Object.entries(longPressTimer)) {
        if (v && k !== button) {
            clearTimeout(v);
            longPressTimer[k] = setTimeout(
                onLongPress(k),
                LONG_PRESS_DURATION
            );
        }
    }
}

function executeBinding(event) {
    let binding = commandBindings.getBinding(event, buttonsDown);
    if (binding) {
        sequenceBinder.reset();
        binding.command();
    } else if (sequenceBinder.execute(event)) {
        sequenceBinder.reset();
    } else {
        setTimeout(sequenceBinder.reset, EVENT_SEQUENCE_TIMEOUT);
    }
}

function messageTestEvent(event) {
    let binding = commandBindings.getBinding(event, buttonsDown);
    let message = {
        "event": event,
        "buttonsDown": buttonsDown,
    };
    if (binding) {
        message["command"] = binding.command.name;
    }
    testPort.postMessage(message);
}

function messageTestSequence(event) {
    testSequence.push(event);
    sequenceBinder.advance(event);
    let message = {
        "sequence": testSequence
    };
    if (typeof sequenceBinder.current === "function") {
        message["command"] = sequenceBinder.current.name;
    }
    testPort.postMessage(message);
    sequenceTimer = setTimeout(() => {
        sequenceBinder.reset();
        testSequence = [];
    }, EVENT_SEQUENCE_TIMEOUT);
}
