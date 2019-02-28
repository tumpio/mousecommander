/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const LONG_PRESS_DURATION = 300;
const EVENT_SEQUENCE_TIMEOUT = 350;
const CLIENT_NAME = "mousecommander";

const PrimaryButton = "0";
const MiddleButton = "1";
const SecondaryButton = "2";

const EventPrimaryUp = "c00";
const EventPrimaryDown = "c10";
const EventPrimaryLongPress = "c20";
const EventMiddleUp = "c01";
const EventMiddleDown = "c11";
const EventMiddleLongPress = "c21";
const EventSecondaryUp = "c02";
const EventSecondaryDown = "c12";
const EventSecondaryLongPress = "c22";
const EventScrollUp = "s1";
const EventScrollDown = "s0";

const EventMouseUp = {
    [PrimaryButton]: EventPrimaryUp,
    [MiddleButton]: EventMiddleUp,
    [SecondaryButton]: EventSecondaryUp
};
const EventMouseDown = {
    [PrimaryButton]: EventPrimaryDown,
    [MiddleButton]: EventMiddleDown,
    [SecondaryButton]: EventSecondaryDown
};
const EventLongPress = {
    [PrimaryButton]: EventPrimaryLongPress,
    [MiddleButton]: EventMiddleLongPress,
    [SecondaryButton]: EventSecondaryLongPress
};
const MouseButtonDown = {
    [PrimaryButton]: 1,
    [MiddleButton]: 1 << 1,
    [SecondaryButton]: 1 << 2
};
const EVENT_TYPES = [
    EventPrimaryUp,
    EventPrimaryDown,
    EventPrimaryLongPress,
    EventMiddleUp,
    EventMiddleDown,
    EventMiddleLongPress,
    EventSecondaryUp,
    EventSecondaryDown,
    EventSecondaryLongPress,
    EventScrollUp,
    EventScrollDown
];

const MESSAGE_START_SIGNAL = "start_signal"

const TYPE_MOUSE_UP = "mouse_up";
const TYPE_MOUSE_DOWN = "mouse_down";
const TYPE_SCROLL_UP = "scroll_up";
const TYPE_SCROLL_DOWN = "scroll_down";
const TYPE_LONG_PRESS = "long_press";

const BUTTON_PRIMARY = "primary";
const BUTTON_MIDDLE = "middle";
const BUTTON_SECONDARY = "secondary";

const MouseButtonValues = {
    [BUTTON_PRIMARY]: PrimaryButton,
    [BUTTON_MIDDLE]: MiddleButton,
    [BUTTON_SECONDARY]: SecondaryButton
};

function getButtonsDownValue(array) {
    let value = 0;
    for (let name of array) {
        let button = MouseButtonValues[name];
        value |= MouseButtonDown[button];
    }
    return value;
}

class CommandBinding {
    constructor(command, buttonsDown) {
        this.command = command;
        this.buttonsDown = buttonsDown;
    }
}

class CommandBindings {
    bind(event, binding) {
        if (typeof this[event] === "undefined") {
            this[event] = [];
        }
        this[event].push(binding);
    }

    getBinding(event, buttonsDown) {
        if (typeof this[event] === "undefined") {
            return null;
        }
        for (let binding of this[event]) {
            if (buttonsDown & binding.buttonsDown) {
                return binding;
            }
        }
        return null;
    }
}

class SequenceBinder {
    constructor() {
        this.start = {};
        this.current = this.start;
    }

    advance(event) {
        let node = this.current[event];
        if (typeof node === "undefined") {
            this.reset();
        } else {
            this.current = node;
        }
    }

    execute(event) {
        this.advance(event);
        if (typeof this.current === "function") {
            this.current();
            return true;
        }
        return false;
    }

    bind(sequence, command) {
        let node = this.start;
        let last = sequence.pop();
        for (let event of sequence) {
            if (typeof node[event] === "function") {
                return false;
            }
            if (typeof node[event] === "undefined") {
                node[event] = {};
            }
            node = node[event];
        }
        node[last] = command;
        return true;
    }

    reset() {
        this.current = this.start;
    }
}
