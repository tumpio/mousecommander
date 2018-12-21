/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

let buttonsDown = 0;
let sequenceTimer = null;
let skipEvent = null;
let commandBindings = new CommandBindings();
let sequenceBinder = new SequenceBinder();
let longPressTimer = {
    [PrimaryButton]: null,
    [MiddleButton]: null,
    [SecondaryButton]: null
};
let longPress = {
    [PrimaryButton]: () => handleMouseEvent(EventPrimaryLongPress),
    [MiddleButton]: () => handleMouseEvent(EventMiddleLongPress),
    [SecondaryButton]: () => handleMouseEvent(EventSecondaryLongPress)
};

const port = browser.runtime.connectNative("mouse_commander");
port.postMessage("start_signal");

port.onMessage.addListener(onMouseEvent);
browser.storage.local.get().then(initOptions);
browser.storage.onChanged.addListener(initChangedOptions);

function wrapReset(command) {
    return () => {
        sequenceBinder.reset();
        return command();
    };
}

function wrapSkip(event, command) {
    return () => {
        skipEvent = event;
        return command();
    };
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
        let button = MouseButtonNames[option.button];
        let command = wrapReset(commands[option.command]);
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
                command = wrapSkip(EventMouseUp[button], command);
                break;
        }
        commandBindings.bind(event, new CommandBinding(command, getButtonsDownValue(option.buttonsDown)));
    }
}

function initSequences(sequences) {
    if (!sequences) return;
    sequenceBinder = new SequenceBinder();
    for (let option of sequences) {
        let sequence = parseSequence(option.sequence);
        sequenceBinder.bind(sequence, commands[option.command]);
    }
}

function onMouseEvent(message) {
    let event = null;
    if (message.length === 3 && message.startsWith(MESSAGE_MOUSE_CLICK)) {
        let event_key = message.charAt(1);
        let button = MESSAGE_BUTTON_KEYS[message.charAt(2)];
        if (event_key === MESSAGE_MOUSE_UP) {
            clearTimeout(longPressTimer[button]);
            buttonsDown ^= MouseButtonDown[button];
            event = EventMouseUp[button];
        } else if (event_key === MESSAGE_MOUSE_DOWN) {
            longPressTimer[button] = setTimeout(
                longPress[button],
                LONG_PRESS_DURATION
            );
            buttonsDown |= MouseButtonDown[button];
            event = EventMouseDown[button];
        }
    } else if (message.length === 2 && message.startsWith(MESSAGE_MOUSE_SCROLL)) {
        let event_key = message.charAt(1);
        if (event_key === MESSAGE_SCROLL_UP) {
            event = EventScrollUp;
        } else if (event_key === MESSAGE_SCROLL_DOWN) {
            event = EventScrollDown;
        }
    }
    if (event) {
        handleMouseEvent(event);
    }
}

function handleMouseEvent(event) {
    if (sequenceTimer) {
        clearTimeout(sequenceTimer);
        sequenceTimer = null;
    }
    if (event !== skipEvent && typeof commandBindings[event] !== "undefined") {
        for (let binding of commandBindings[event]) {
            if (buttonsDown & binding.buttonsDown) {
                return binding.execute();
            }
        }
    } else {
        skipEvent = null;
    }
    if (!sequenceTimer) {
        sequenceTimer = setTimeout(sequenceBinder.reset, 350);
    }
    sequenceBinder.advance(event);
}
