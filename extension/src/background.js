/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

let buttonsDown = 0;
let sequenceTimer = null;
let noFocus = false;
let skipEvents = new Set();
let clientPort = null;
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
    [SecondaryButton]: null,
};
let windowNoFocusTimer = null;
let noFocusTimeout = 60 * 1000;

browser.storage.local.get().then(init);
browser.storage.onChanged.addListener(initChangedOptions);

browser.runtime.onConnect.addListener((port) => {
    if (port.name === "event" || port.name === "sequence") {
        testPort = port;
        testingEvent = port.name === "event";
        testingSequence = !testingEvent;
        port.onDisconnect.addListener(onDebugDisconnected);
    }
});

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.status) {
        if (clientPort && clientPort.error) {
            sendResponse({
                connected: false,
                error: clientPort.error.message,
            });
        } else {
            sendResponse({
                connected: clientPort !== null,
            });
        }
    }
});

browser.browserSettings.contextMenuShowEvent.set({ value: "mouseup" });

function init(options) {
    initEvents(options["events"]);
    initSequences(options["sequences"]);
    startClientConnection();
    addWidowFocusListener();
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

function addWidowFocusListener() {
    browser.windows.onFocusChanged.addListener((windowId) => {
        clearTimeout(windowNoFocusTimer);
        noFocus = windowId === browser.windows.WINDOW_ID_NONE;
        if (noFocus) {
            windowNoFocusTimer = setTimeout(disconnectClient, noFocusTimeout);
        } else if (!clientPort) {
            startClientConnection();
        }
    });
}

function startClientConnection() {
    clientPort = browser.runtime.connectNative(CLIENT_NAME);
    clientPort.onDisconnect.addListener((port) => {
        if (!port.error) {
            clientPort = null;
        }
    });
    clientPort.postMessage(MESSAGE_START_SIGNAL);
    clientPort.onMessage.addListener(onMouseEvent);
}

function disconnectClient() {
    clientPort.onMessage.removeListener(onMouseEvent);
    clientPort.disconnect();
    clientPort = null;
    for (let timer of Object.values(longPressTimer)) {
        clearTimeout(timer);
    }
    sequenceBinder.reset();
    buttonsDown = 0;
}

function onDebugDisconnected() {
    testPort = null;
    testingEvent = false;
    testingSequence = false;
}

function onLongPress(button) {
    return () => {
        longPressTimer[button] = null;
        onMouseEvent(EventLongPress[button]);
    };
}

function onMouseEvent(event) {
    updateButtonsDown(event);
    if (skipEvents.has(event)) {
        skipEvents.delete(event);
        return;
    }

    if (noFocus) {
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
        if (button === SecondaryButton) {
            resetContextMenuSkip();
        }
    } else if (event === EventMouseDown[button]) {
        longPressTimer[button] = setTimeout(onLongPress(button), LONG_PRESS_DURATION);
        buttonsDown |= MouseButtonDown[button];
    } else if (event === EventLongPress[button]) {
        skipEvents.add(EventMouseUp[button]);
    }
    for (let [k, v] of Object.entries(longPressTimer)) {
        if (v && k !== button) {
            clearTimeout(v);
            longPressTimer[k] = setTimeout(onLongPress(k), LONG_PRESS_DURATION);
        }
    }
}

function executeBinding(event) {
    let command = commandBindings.getCommand(event, buttonsDown) || sequenceBinder.getCommand(event);
    if (command) {
        sequenceBinder.reset();
        command().then(() => {
            if (buttonsDown & MouseButtonDown[SecondaryButton]) {
                preventContextMenu();
            }
        });
    } else {
        setTimeout(sequenceBinder.reset, EVENT_SEQUENCE_TIMEOUT);
    }
}

function messageTestEvent(event) {
    let command = commandBindings.getCommand(event, buttonsDown);
    let message = {
        event: event,
        buttonsDown: buttonsDown,
    };
    if (command) {
        message["command"] = command.name;
    }
    testPort.postMessage(message);
}

function messageTestSequence(event) {
    testSequence.push(event);
    let command = sequenceBinder.getCommand(event);
    let message = {
        sequence: testSequence,
    };
    if (command) {
        message["command"] = command.name;
    }
    testPort.postMessage(message);
    sequenceTimer = setTimeout(() => {
        sequenceBinder.reset();
        testSequence = [];
    }, EVENT_SEQUENCE_TIMEOUT);
}
