/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 const EventPrimaryClick = Symbol();
 const EventPrimaryDoubleClick = Symbol();
 const EventPrimaryDownAndLong = Symbol();
 const EventMiddleClick = Symbol();
 const EventMiddleDoubleClick = Symbol();
 const EventMiddleDownAndLong = Symbol();
 const EventSecondaryClick = Symbol();
 const EventSecondaryDoubleClick = Symbol();
 const EventSecondaryDownAndLong = Symbol();

const eventTranslations = {
    [EventPrimaryUp]: browser.i18n.getMessage("event_primary_up"),
    [EventPrimaryDown]: browser.i18n.getMessage("event_primary_down"),
    [EventPrimaryClick]: browser.i18n.getMessage("event_primary_click"),
    [EventPrimaryDoubleClick]: browser.i18n.getMessage("event_primary_double_click"),
    [EventPrimaryLongPress]: browser.i18n.getMessage("event_primary_long_press"),
    [EventPrimaryDownAndLong]: browser.i18n.getMessage("event_primary_long_press"),
    [EventMiddleUp]: browser.i18n.getMessage("event_middle_up"),
    [EventMiddleDown]: browser.i18n.getMessage("event_middle_down"),
    [EventMiddleClick]: browser.i18n.getMessage("event_middle_click"),
    [EventMiddleDoubleClick]: browser.i18n.getMessage("event_middle_double_click"),
    [EventMiddleLongPress]: browser.i18n.getMessage("event_middle_long_press"),
    [EventMiddleDownAndLong]: browser.i18n.getMessage("event_middle_long_press"),
    [EventSecondaryUp]: browser.i18n.getMessage("event_secondary_up"),
    [EventSecondaryDown]: browser.i18n.getMessage("event_secondary_down"),
    [EventSecondaryClick]: browser.i18n.getMessage("event_secondary_click"),
    [EventSecondaryDoubleClick]: browser.i18n.getMessage("event_secondary_double_click"),
    [EventSecondaryLongPress]: browser.i18n.getMessage("event_secondary_long_press"),
    [EventSecondaryDownAndLong]: browser.i18n.getMessage("event_secondary_long_press"),
    [EventScrollUp]: browser.i18n.getMessage("event_scroll_up"),
    [EventScrollDown]: browser.i18n.getMessage("event_scroll_down")
};

const EventClick = {
    [PrimaryButton]: EventPrimaryClick,
    [MiddleButton]: EventMiddleClick,
    [SecondaryButton]: EventSecondaryClick
};

const EventDoubleClick = {
    [EventPrimaryClick]: EventPrimaryDoubleClick,
    [EventMiddleClick]: EventMiddleDoubleClick,
    [EventSecondaryClick]: EventSecondaryDoubleClick
};

const EventDownLongPress = {
    [PrimaryButton]: EventPrimaryDownAndLong,
    [MiddleButton]: EventMiddleDownAndLong,
    [SecondaryButton]: EventSecondaryDownAndLong
};

function translateSequence(sequence) {
    let reduced = sequence.reduce(function (acc, event) {
        let reduced = reduceClicks(acc, event);
        if (!reduced)
            reduced = reduceDownLongPress(acc, event);
        if (!reduced) {
            acc.push(event);
        }
        return acc;
    }, []);
    return reduced.map(event => eventTranslations[event]).join(" → ");
}

function translateCommand(command) {
    return browser.i18n.getMessage("command_" + command);
}

function isOtherButtonDown(event, button, buttonsDown) {
    return buttonsDown & MouseButtonDown[button] && event !== EventMouseDown[button] && event !== EventLongPress[button];
}

function translateButton(button) {
    let name;
    for (let [k, v] of Object.entries(MouseButtonValues)) {
        if (v === button.toString()) {
            name = k;
            break;
        }
    }
    return browser.i18n.getMessage("button_" + name);
}

function translateButtonsDown(event, buttonsDown) {
    let buttons = [];
    for (let button of Object.keys(MouseButtonDown)) {
        if (isOtherButtonDown(event, button, buttonsDown)) {
            buttons.push(button);
        }
    }
    if (buttons.length === 1) {
        return browser.i18n.getMessage("button_down_info", translateButton(buttons[0]));
    } else if (buttons.length > 1) {
        return browser.i18n.getMessage("buttons_down_info", buttons.map(translateButton).join());
    }
    return "";
}

function eventDebugText(event, buttonsDown, command) {
    let otherDown = translateButtonsDown(event, buttonsDown);
    return eventTranslations[event] + (otherDown ? " + " + otherDown : "") + (command ? " = " + translateCommand(command) : "");
}

function sequenceDebugText(sequence, command) {
    return translateSequence(sequence) + (command ? " = " + translateCommand(command) : "");
}

function reduceDownLongPress(acc, e2) {
    if (acc.length < 1) {
        return false;
    }
    let e1 = acc[acc.length - 1];
    if (e1.length !== 3) {
        return false;
    }
    let button = e1.charAt(2);
    if (e1 === EventMouseDown[button] && e2 === EventLongPress[button]) {
        acc[acc.length - 1] = EventDownLongPress[button];
        return true;
    }
    return false;
}

function reduceClicks(acc, e2) {
    if (acc.length < 1) {
        return false;
    }
    let e1 = acc[acc.length - 1];
    if (e1.length !== 3) {
        return false;
    }
    let button = e1.charAt(2);
    if (e1 === EventMouseDown[button] && e2 === EventMouseUp[button]) {
        acc[acc.length - 1] = EventClick[button];
        reduceDoubleClick(acc);
        return true;
    }
    return false;
}

function reduceDoubleClick(acc) {
    if (acc.length < 2) {
        return false;
    }
    let e1 = acc[acc.length - 2];
    let e2 = acc[acc.length - 1];
    if (e1 === e2) {
        acc[acc.length - 2] = EventDoubleClick[e1];
        acc.pop();
        return true;
    }
    return false;
}
