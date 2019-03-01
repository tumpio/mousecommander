/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const commands = {
    switchToNextTab: switchToNextTab,
    switchToNextTabLoop: switchToNextTabLoop,
    switchToPreviousTab: switchToPreviousTab,
    switchToPreviousTabLoop: switchToPreviousTabLoop,
    restoreLastActiveTab: restoreLastActiveTab,
    createNewTab: createNewTab,
    dublicateCurrentTab: dublicateCurrentTab,
    toggleTabPinning: toggleTabPinning,
    moveTabToNewWindow: moveTabToNewWindow,
    closeCurrentTab: closeCurrentTab,
    closeOtherTabs: closeOtherTabs,
    closeTabsOnLeft: closeTabsOnLeft,
    closeTabsOnRight: closeTabsOnRight,
    restoreClosedTab: restoreClosedTab,
    goBackInHistory: goBackInHistory,
    goForwardInHistory: goForwardInHistory,
    reloadPage: reloadPage,
    increaseZoom: increaseZoom,
    decreaseZoom: decreaseZoom,
    resetZoom: resetZoom,
    scrollToTop: scrollToTop,
    scrollToBottom: scrollToBottom,
    highlightSelectedText: highlightSelectedText,
    toggleBookmark: toggleBookmark,
    toggleReaderMode: toggleReaderMode
};

// Tab commands

async function switchToNextTabLoop() {
    let [current, all] = await Promise.all([
        getCurrentTab(),
        getAllTabs()
    ]);
    let nextIndex = current.index + 1;
    if (nextIndex >= all.length) {
        nextIndex = 0;
    }
    let query = await browser.tabs.query({ index: nextIndex, currentWindow: true });
    return browser.tabs.update(query[0].id, { active: true });
}

async function switchToPreviousTabLoop() {
    let [current, all] = await Promise.all([
        getCurrentTab(),
        getAllTabs()
    ]);
    let prevIndex = current.index - 1;
    if (prevIndex < 0) {
        prevIndex = all.length - 1;
    }
    let query = await browser.tabs.query({ index: prevIndex, currentWindow: true });
    return browser.tabs.update(query[0].id, { active: true });
}

async function switchToNextTab() {
    let [current, all] = await Promise.all([
        getCurrentTab(),
        getAllTabs()
    ]);
    let nextIndex = current.index + 1;
    if (nextIndex < all.length) {
        let query = await browser.tabs.query({ index: nextIndex, currentWindow: true });
        return browser.tabs.update(query[0].id, { active: true });
    }
}

async function switchToPreviousTab() {
    let current = await getCurrentTab();
    let prevIndex = current.index - 1;
    if (prevIndex >= 0) {
        let query = await browser.tabs.query({ index: prevIndex, currentWindow: true });
        return browser.tabs.update(query[0].id, { active: true });
    }
}

async function closeCurrentTab() {
    let current = await getCurrentTab();
    return browser.tabs.remove(current.id);
}

async function closeOtherTabs() {
    let other = await getOtherTabs();
    let toClose = [];
    for (let tab of other) {
        toClose.push(tab.id);
    }
    return browser.tabs.remove(toClose);
}

async function closeTabsOnLeft() {
    let tabs = await getAllTabs();
    let toClose = [];
    for (let tab of tabs) {
        if (tab.active)
            break;
        toClose.push(tab.id);
    }
    return browser.tabs.remove(toClose);
}

async function closeTabsOnRight() {
    let tabs = await getAllTabs();
    let toClose = [];
    for (let i = tabs.length - 1; i >= 0; i--) {
        if (tabs[i].active)
            break;
        toClose.push(tabs[i].id);
    }
    return browser.tabs.remove(toClose);
}

async function dublicateCurrentTab() {
    let current = await getCurrentTab();
    return browser.tabs.duplicate(current.id);
}

function reloadPage() {
    return browser.tabs.reload();
}

async function moveTabToNewWindow() {
    let current = await getCurrentTab();
    return browser.windows.create({ tabId: current.id });
}

async function restoreClosedTab() {
    let sessionInfos = await browser.sessions.getRecentlyClosed({
        maxResults: 1
    });
    let sessionInfo = sessionInfos[0];
    if (!sessionInfo) {
        return createNewTab();
    } else if (sessionInfo.tab) {
        return browser.sessions.restore(sessionInfo.tab.sessionId);
    } else if (sessionInfo.window) {
        return browser.sessions.restore(sessionInfo.window.sessionId);
    }
}

async function restoreLastActiveTab() {
    let tabs = await browser.tabs.query({
        active: false, currentWindow: true
    });
    let tab = tabs[0];
    for (let i = 1; i < tabs.length; i++) {
        if (tabs[i].lastAccessed > tab.lastAccessed)
            tab = tabs[i];
    }
    return browser.tabs.update(tab.id, { active: true });
}

function createNewTab() {
    return browser.tabs.create({});
}

async function toggleTabPinning() {
    let current = await getCurrentTab();
    return browser.tabs.update({ "pinned": !current.pinned });
}

function toggleReaderMode() {
    browser.tabs.toggleReaderMode();
}

// Zoom commands

const MAX_ZOOM = 3;
const MIN_ZOOM = 0.3;

async function increaseZoom() {
    let zoom = await browser.tabs.getZoom();
    if (zoom < MAX_ZOOM)
        browser.tabs.setZoom(null, zoom + 0.1);
}

async function decreaseZoom() {
    let zoom = await browser.tabs.getZoom();
    if (zoom > MIN_ZOOM)
        browser.tabs.setZoom(null, zoom - 0.1);
}

function resetZoom() {
    return browser.tabs.setZoom(null, 0);
}

// Bookmark commands

async function toggleBookmark() {
    let tab = await getCurrentTab();
    let bookmarks = await browser.bookmarks.search({
        url: tab.url
    });
    if (bookmarks.length) {
        for (let bookmark of bookmarks) {
            browser.bookmarks.remove(bookmark.id);
        }
    } else {
        browser.bookmarks.create({
            title: tab.title,
            url: tab.url
        });
    }
}

// History commands

function goBackInHistory() {
    browser.tabs.executeScript({
        code: "window.history.back();"
    });
}

function goForwardInHistory() {
    browser.tabs.executeScript({
        code: "window.history.forward();"
    });
}

// Scroll commands

function scrollToTop() {
    browser.tabs.executeScript({
        code: "window.scrollTo(window.scrollX, 0);"
    });
}

function scrollToBottom() {
    browser.tabs.executeScript({
        code: "window.scrollTo(window.scrollX, document.body.scrollHeight);"
    });
}

function highlightSelectedText() {
    browser.tabs.executeScript({
        code: "window.getSelection().toString();"
    }).then(text => {
        if (!text[0])
            return Promise.reject();
        return browser.find.find(text[0]);
    }).then(() => {
        browser.find.highlightResults();
    }, () => {
        browser.find.removeHighlighting();
    });
}

// Helper functions

async function getCurrentTab() {
    let query = await browser.tabs.query({ active: true, currentWindow: true });
    return query[0];
}

function getAllTabs() {
    return browser.tabs.query({ currentWindow: true });
}

function getOtherTabs() {
    return browser.tabs.query({
        active: false, currentWindow: true
    });
}
