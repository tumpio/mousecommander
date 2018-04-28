/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const MouseDown = 1;
const MouseUp = 2;
const WheelUp = 3;
const WheelDown = 4;
const LongPress = 5;

const PrimaryButton = 0;
const MiddleButton = 1;
const SecondaryButton = 2;

const MouseButtons = {};
MouseButtons[PrimaryButton] = "primary_button";
MouseButtons[MiddleButton] = "middle_button";
MouseButtons[SecondaryButton] = "secondary_button";

const MouseEvents = {};
MouseEvents[MouseDown] = "button_down";
MouseEvents[MouseUp] = "button_up";
MouseEvents[WheelUp] = "wheel_up";
MouseEvents[WheelDown] = "wheel_down";
MouseEvents[LongPress] = "long_press";

const ButtonDown = {};
ButtonDown[PrimaryButton] = 1;
ButtonDown[SecondaryButton] = 2;
ButtonDown[MiddleButton] = 4;

function isOtherButtonDown(otherButton, event) {
    if ((event.type === MouseDown || event.type === LongPress)
        && otherButton === ButtonDown[event.button])
        return false;
    return event.buttonsDown & otherButton;
}

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

class MouseEventSequence {
    constructor() {
        this.sequence = [];
    }

    add(event) {
        this.sequence.push(event);
    }

    parseFromString(str) {
        this.sequence = [];
        for (let i = 0; i < str.length; i += 2) {
            try {
                this.sequence.push(new McMouseEvent(parseInt(str.charAt(i)), parseInt(str.charAt(i + 1))));
            } catch (e) {
                console.error(e);
            }
        }
    }

    isClick(i, button) {
        if (i + 1 >= this.sequence.length) return false;
        return this.sequence[i].type === MouseDown && this.sequence[i + 1].type === MouseUp
            && this.sequence[i].button === this.sequence[i + 1].button && this.sequence[i].button === button;
    }

    translate() {
        let translatables = [];
        let i = 0;
        while (i < this.sequence.length) {
            let button = this.sequence[i].button;
            if (this.isClick(i, button) && this.isClick(i + 2, button)) {
                translatables.push({
                    translate: function () {
                        return browser.i18n.getMessage("button_double_click_info",
                            browser.i18n.getMessage(MouseButtons[button]));
                    }
                });
                i += 4;
            } else if (this.isClick(i, button)) {
                translatables.push({
                    translate: function () {
                        return browser.i18n.getMessage("button_click_info",
                            browser.i18n.getMessage(MouseButtons[button]));
                    }
                });
                i += 2;
            } else {
                translatables.push(this.sequence[i]);
                i++;
            }
        }
        return translatables.map(t => t.translate(false)).join(" → ");
    }

    toString() {
        return this.sequence.join("");
    }

    equals(b) {
        if (!(b instanceof MouseEventSequence)) return false;
        if (this.sequence.length !== b.sequence.length) return false;

        for (let i = 0; i < b.sequence.length; i++) {
            if (this.sequence[i].button !== b.sequence[i].button ||
                this.sequence[i].type !== b.sequence[i].type)
                return false;
        }
        return true;
    }
}