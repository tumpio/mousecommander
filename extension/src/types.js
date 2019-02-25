/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const LONG_PRESS_DURATION = 300;
const EVENT_SEQUENCE_TIMEOUT = 350;

const PrimaryButton = Symbol("Primary");
const MiddleButton = Symbol("Middle");
const SecondaryButton = Symbol("Secondary");

const EventPrimaryUp = Symbol("Primary Up");
const EventPrimaryDown = Symbol("Primary Down");
const EventPrimaryClick = Symbol("Primary Click");
const EventPrimaryDoubleClick = Symbol("Primary Click");
const EventPrimaryLongPress = Symbol("Primary Long Press");
const EventMiddleUp = Symbol("Middle Up");
const EventMiddleDown = Symbol("Middle Down");
const EventMiddleClick = Symbol("Middle Click");
const EventMiddleDoubleClick = Symbol("Middle Double Click");
const EventMiddleLongPress = Symbol("Middle Long Press");
const EventSecondaryUp = Symbol("Secondary Up");
const EventSecondaryDown = Symbol("Secondary Down");
const EventSecondaryClick = Symbol("Secondary Click");
const EventSecondaryDoubleClick = Symbol("Secondary Double Click");
const EventSecondaryLongPress = Symbol("Secondary Long Press");
const EventScrollUp = Symbol("Scroll Up");
const EventScrollDown = Symbol("Scroll Down");

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

const MESSAGE_MOUSE_CLICK = "c";
const MESSAGE_MOUSE_SCROLL = "s";
const MESSAGE_MOUSE_UP = "0";
const MESSAGE_MOUSE_DOWN = "1";
const MESSAGE_LONG_PRESS = "2";
const MESSAGE_SCROLL_UP = "1";
const MESSAGE_SCROLL_DOWN = "0";
const MESSAGE_BUTTON_KEYS = {
    "0": PrimaryButton,
    "1": MiddleButton,
    "2": SecondaryButton
};
const TYPE_MOUSE_UP = "mouse_up";
const TYPE_MOUSE_DOWN = "mouse_down";
const TYPE_SCROLL_UP = "scroll_up";
const TYPE_SCROLL_DOWN = "scroll_down";
const TYPE_LONG_PRESS = "long_press";

const BUTTON_PRIMARY = "primary";
const BUTTON_MIDDLE = "middle";
const BUTTON_SECONDARY = "secondary";

const MouseButtonNames = {
    [BUTTON_PRIMARY]: PrimaryButton,
    [BUTTON_MIDDLE]: MiddleButton,
    [BUTTON_SECONDARY]: SecondaryButton
};

function getButtonsDownValue(array) {
    let value = 0;
    for (let name of array) {
        let button = MouseButtonNames[name];
        value |= MouseButtonDown[button];
    }
    return value;
}

function parseSequence(str) {
    let sequence = [];
    for (let i = 0; i < str.length; i++) {
        if (str.charAt(i) === MESSAGE_MOUSE_CLICK) {
            let event_key = str.charAt(i + 1);
            let button = MESSAGE_BUTTON_KEYS[str.charAt(i + 2)];
            if (event_key === MESSAGE_MOUSE_UP) {
                sequence.push(EventMouseUp[button]);
            } else if (event_key === MESSAGE_MOUSE_DOWN) {
                sequence.push(EventMouseDown[button]);
            } else if (event_key === MESSAGE_LONG_PRESS) {
                sequence.push(EventLongPress[button]);
            }
            i += 2;
        } else if (str.charAt(i) === MESSAGE_MOUSE_SCROLL) {
            let event_key = str.charAt(1);
            if (event_key === MESSAGE_SCROLL_UP) {
                sequence.push(EventScrollUp);
            } else if (event_key === MESSAGE_SCROLL_DOWN) {
                sequence.push(EventScrollDown);
            }
            i += 1;
        }
    }
    return sequence;
}

class CommandBinding {
    constructor(command, buttonsDown) {
        this.execute = command;
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
        } else if (typeof node === "function") {
            this.reset();
            node();
        } else {
            this.current = node;
        }
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

/*

class McMouseEvent {
    constructor(button, type, buttonsDown) {
        this.button = button;
        this.type = type;
        this.buttonsDown = buttonsDown;
    }

    translate(buttonsDownInfo = true) {
        let str = "";
        let button = "";
        let buttonsDown = [];
        if (this.type !== WheelUp && this.type !== WheelDown) {
            button = browser.i18n.getMessage(MouseButtons[this.button]);
        }
        for (let b of Object.keys(MouseButtons)) {
            if (isOtherButtonDown(ButtonDown[b], this)) {
                buttonsDown.push(browser.i18n.getMessage(MouseButtons[b]))
            }
        }
        str += browser.i18n.getMessage("event_info", [button, browser.i18n.getMessage(MouseEvents[this.type])]);
        if (buttonsDownInfo) {
            if (buttonsDown.length === 1) {
                str += " + ";
                str += browser.i18n.getMessage("button_down_info", buttonsDown[0]);
            } else if (buttonsDown.length > 1) {
                str += " + ";
                str += browser.i18n.getMessage("buttons_down_info", buttonsDown.join());
            }
        }
        return str;
    }

    toString() {
        return this.button.toString() + this.type.toString();
    }
}
*/