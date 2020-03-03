/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Prevent context menu on secondary mouse down commands.
 */
browser.runtime.onMessage.addListener(request => {
    if (request.preventContextMenu) {
        window.addEventListener("contextmenu", prevent, { once: true }, false);
    } else if (request.reset) {
        window.removeEventListener("contextmenu", prevent, false);
    }
});

/**
 * Prevent page zoom on mouse down + wheel commands.
 */
window.addEventListener("mousedown", function (e) {
    window.addEventListener("wheel", preventOnButtonsDown, false);
}, false);

window.addEventListener("mouseup", function (e) {
    window.removeEventListener("wheel", preventOnButtonsDown, false);
}, false);

/**
 * Prevent link open on middle click commands.
 */
window.addEventListener("auxclick", function (e) {
    if (e.button === 1 && e.buttons !== 0) {
        prevent(e);
    }
}, false);

browser.runtime.connect({
    "name": "content"
});

function preventOnButtonsDown(e) {
    if (e.buttons !== 0) {
        prevent(e);
    }
}

function prevent(event) {
    event.preventDefault();
}
