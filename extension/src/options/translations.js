/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const eventTranslations = {
    [EventPrimaryUp]: browser.i18n.getMessage("event_primary_up"),
    [EventPrimaryDown]: browser.i18n.getMessage("event_primary_down"),
    [EventPrimaryClick]: browser.i18n.getMessage("event_primary_click"),
    [EventPrimaryDoubleClick]: browser.i18n.getMessage("event_primary_double_click"),
    [EventPrimaryLongPress]: browser.i18n.getMessage("event_primary_long_press"),
    [EventMiddleUp]: browser.i18n.getMessage("event_middle_up"),
    [EventMiddleDown]: browser.i18n.getMessage("event_middle_down"),
    [EventMiddleClick]: browser.i18n.getMessage("event_middle_click"),
    [EventMiddleDoubleClick]: browser.i18n.getMessage("event_middle_double_click"),
    [EventMiddleLongPress]: browser.i18n.getMessage("event_middle_long_press"),
    [EventSecondaryUp]: browser.i18n.getMessage("event_secondary_up"),
    [EventSecondaryDown]: browser.i18n.getMessage("event_secondary_down"),
    [EventSecondaryClick]: browser.i18n.getMessage("event_secondary_click"),
    [EventSecondaryDoubleClick]: browser.i18n.getMessage("event_secondary_double_click"),
    [EventSecondaryLongPress]: browser.i18n.getMessage("event_secondary_long_press"),
    [EventScrollUp]: browser.i18n.getMessage("event_scroll_up"),
    [EventScrollDown]: browser.i18n.getMessage("event_scroll_down")
};

function translateSequence(str) {
    let sequence = parseSequence(str).reduce(function (acc, event) {
        let click = isClick(acc, event);
        if (click) {
            let doubleClick = isDoubleClick(acc, click);
            if (doubleClick) {
                acc[acc.length - 2] = doubleClick;
                acc.pop();
            } else {
                acc[acc.length - 1] = click;
            }
        } else {
            acc.push(event);
        }
        return acc;
    }, []);
    return sequence.map(event => eventTranslations[event]).join(" → ");
}

function isClick(acc, e2) {
    if (acc.length < 1) {
        return false;
    }
    let e1 = acc[acc.length - 1];
    if (e1 === EventPrimaryDown && e2 === EventPrimaryUp)
        return EventPrimaryClick;
    if (e1 === EventSecondaryDown && e2 === EventSecondaryUp)
        return EventSecondaryClick;
    if (e1 === EventMiddleDown && e2 === EventMiddleUp)
        return EventMiddleClick;
    return false;
}

function isDoubleClick(acc, click) {
    if (acc.length < 2 || acc[acc.length - 2] !== click) {
        return false;
    }
    if (click === EventPrimaryClick)
        return EventPrimaryDoubleClick;
    if (click === EventSecondaryClick)
        return EventSecondaryDoubleClick;
    if (click === EventMiddleClick)
        return EventMiddleDoubleClick;
    return false;
}
