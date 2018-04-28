/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

let resetSequenceTimer;
let eventSequence = new MouseEventSequence();
let nextEventToSkip;

let localOptions = {};

browser.storage.local.get().then(init);
browser.storage.onChanged.addListener(initOnChange);
browser.runtime.onMessage.addListener(handleMouseEvent);

function init(options) {
    if (!options.disabled) {
        localOptions.events = options.events;
        localOptions.sequences = options.sequences;
        for (let sequence of localOptions.sequences) {
            let s = new MouseEventSequence();
            s.parseFromString(sequence.sequence);
            sequence.sequence = s;
        }
    }
}

function initOnChange(changes) {
    for (let change of Object.keys(changes)) {
        localOptions[change] = changes[change].newValue;
        if (change === "sequences")
            for (let sequence of localOptions.sequences) {
                let s = new MouseEventSequence();
                s.parseFromString(sequence.sequence);
                sequence.sequence = s;
            }
    }
}

function resetEventSequence() {
    eventSequence = new MouseEventSequence();
}

function executeEventCommand(type, button, buttonsDown) {
    if (!localOptions.events) return;
    for (let event of localOptions.events) {
        if (event.type === type && event.button === button && event.buttonsDown === buttonsDown) {
            return commands[event.command]();
        }
    }
    return null;
}

function executeSequenceCommand(event) {
    if (!localOptions.sequences) return;
    eventSequence.add(event);

    for (let sequence of localOptions.sequences) {
        if (eventSequence.equals(sequence.sequence)) {
            return commands[sequence.command]();
        }
    }
    return null;
}

function handleMouseEvent(event) {
    clearTimeout(resetSequenceTimer);

    if (nextEventToSkip && nextEventToSkip.button === event.button && nextEventToSkip.type === event.type) {
        nextEventToSkip = null;
        resetEventSequence();
        return;
    }

    let executed = executeEventCommand(event.type, event.button, event.buttonsDown)
        || executeSequenceCommand(event);

    if (executed) {
        resetEventSequence();
        if (event.type === LongPress) {
            nextEventToSkip = {button: event.button, type: MouseUp};
        }
        if (event.button === 2 && (event.type === MouseDown || event.type === LongPress)
            || event.buttonsDown & 2) {
            executed.then(() => {
                getCurrentTab().then(values => {
                    browser.tabs.sendMessage(
                        values[0].id,
                        {preventContextmenu: true}
                    )
                });
            });
        }
    } else {
        resetSequenceTimer = setTimeout(resetEventSequence, 350);
    }
}
