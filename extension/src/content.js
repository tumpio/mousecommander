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
 * Prevent page zoom/scroll on mouse down + wheel commands.
 */
const wheelListenerOptions = { capture: true, passive: false };

function preventOnButtonsDown(e) {
    if (e.buttons !== 0) {
        e.preventDefault();
    }
}

window.addEventListener("mousedown", function () {
    window.addEventListener("wheel", preventOnButtonsDown, wheelListenerOptions);
}, false);

window.addEventListener("mouseup", function () {
    window.removeEventListener("wheel", preventOnButtonsDown, wheelListenerOptions);
}, false);

/**
 * Prevent link open on middle click commands.
 */
window.addEventListener("auxclick", function (e) {
    if (e.button === 1 && e.buttons !== 0) {
        e.preventDefault();
    }
}, false);

browser.runtime.connect({
    "name": "content"
});
