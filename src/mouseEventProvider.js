/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const mouseEventTypes = {};
mouseEventTypes["mousedown"] = MouseDown;
mouseEventTypes["mouseup"] = MouseUp;

let longPressTimers = {};
let preventContextmanu = false;
let contextmenuDisableTimer;

function mapEventToType(event) {
    if (event.type === "wheel") {
        if (event.deltaY > 0) return WheelDown;
        else return WheelUp;
    } else return mouseEventTypes[event.type];
}

function onContextMenu(event) {
    if (preventContextmanu) {
        event.preventDefault();
        preventContextmanu = false;
    }
}

function messageEvent(event, target) {
    console.log(target);
    if (typeof MOUSE_COMMANDER_TEST_MODE !== "undefined" && target) {
        target.dispatchEvent(new CustomEvent("mousecommmand", {detail: event}));
    } else {
        browser.runtime.sendMessage(event);
    }
}

function onMouseEvent(event) {
    if (event.type === "wheel" && event.buttons !== 0) {
        event.preventDefault();
    }
    messageEvent(new McMouseEvent(event.button, mapEventToType(event), event.buttons), event.currentTarget);
    if (event.type === "mouseup" && longPressTimers[event.button] != null) {
        clearTimeout(longPressTimers[event.button]);
        delete longPressTimers[event.button];
    } else if (event.type === "mousedown") {
        let currentTarget = event.currentTarget;
        longPressTimers[event.button] = setTimeout(function () {
            messageEvent(new McMouseEvent(event.button, LongPress, event.buttons), currentTarget);
        }, 300);
    }
}

function attachListerns(node) {
    node.addEventListener("mousedown", onMouseEvent);
    node.addEventListener("mouseup", onMouseEvent);
    node.addEventListener("wheel", onMouseEvent);
    node.addEventListener("contextmenu", onContextMenu);
}

if (typeof MOUSE_COMMANDER_TEST_MODE !== "undefined") {
    document.addEventListener("DOMContentLoaded", function () {
        for (let area of document.querySelectorAll(".test_area")) {
            attachListerns(area);
        }
    });
} else {
    attachListerns(document);
}

browser.runtime.onMessage.addListener(message => {
    if (message.preventContextmenu) {
        clearTimeout(contextmenuDisableTimer);
        preventContextmanu = true;
        contextmenuDisableTimer = setTimeout(function () {
            preventContextmanu = false;
        }, 1000);
    }
});