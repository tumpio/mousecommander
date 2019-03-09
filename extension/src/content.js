/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

browser.runtime.onMessage.addListener(request => {
    if (request.preventContextMenu) {
        window.addEventListener("contextmenu", preventOnce, false);
    } else if (request.reset) {
        window.removeEventListener("contextmenu", preventOnce, false);
    }
});

function preventOnce(event) {
    event.preventDefault();
    window.removeEventListener("contextmenu", preventOnce, false);
}

window.addEventListener("wheel", function (e) {
    if (e.buttons !== 0) {
        e.preventDefault();
    }
}, false);

window.addEventListener("click", function (e) {
    if (e.button === 1 && e.buttons !== 0) {
        e.preventDefault();
    }
}, false);

browser.runtime.connect({
    "name": "content"
});
