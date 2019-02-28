/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const commands = {
    switchToNextTab: switchToNextTab,
    switchToPreviousTab: switchToPreviousTab,
    closeCurrentTab: closeCurrentTab,
    closeOtherTabs: closeOtherTabs,
    closeTabsOnLeft: closeTabsOnLeft,
    closeTabsOnRight: closeTabsOnRight,
    dublicateCurrentTab: dublicateCurrentTab,
    reloadCurrentTab: reloadCurrentTab,
    moveCurrentTabToNewWindow: moveCurrentTabToNewWindow,
    restoreClosedTab: restoreClosedTab,
    createNewTab: createNewTab,
    increaseZoom: increaseZoom,
    decreaseZoom: decreaseZoom,
    resetZoom: resetZoom,
    scrollToTop: scrollToTop,
    scrollToBottom: scrollToBottom,
    findSelectedText: findSelectedText,
    toggleBookmark: toggleBookmark
};

// Tab commands

function switchToNextTab() {
    return Promise.all([
        getAllTabs(),
        getCurrentTab()
    ]).then(function ([all, current]) {
        let nextIndex = current[0].index + 1;
        if (nextIndex >= all.length) {
            nextIndex = 0;
        }
        return browser.tabs.query({index: nextIndex, currentWindow: true});
    }).then(activateTab);
}

function switchToPreviousTab() {
    return Promise.all([
        getAllTabs(),
        getCurrentTab()
    ]).then(function ([all, current]) {
        let prevIndex = current[0].index - 1;
        if (prevIndex < 0) {
            prevIndex = all.length - 1;
        }
        return browser.tabs.query({index: prevIndex, currentWindow: true});
    }).then(activateTab);
}

function closeCurrentTab() {
    return getCurrentTab().then(values => {
        browser.tabs.remove(values[0].id);
    });
}

function closeOtherTabs() {
    return browser.tabs.query({
        active: false, currentWindow: true
    }).then(values => {
        let tabsToClose = [];
        for (let tab of values) {
            tabsToClose.push(tab.id);
        }
        browser.tabs.remove(tabsToClose);
    });
}

function closeTabsOnLeft() {
    return getAllTabs().then(values => {
        let tabsToClose = [];
        for (let tab of values) {
            if (tab.active)
                break;
            tabsToClose.push(tab.id);
        }
        browser.tabs.remove(tabsToClose);
    });
}

function closeTabsOnRight() {
    return getAllTabs().then(values => {
        let tabsToClose = [];
        for (let i = values.length - 1; i >= 0; i--) {
            if (values[i].active)
                break;
            tabsToClose.push(values[i].id);
        }
        browser.tabs.remove(tabsToClose);
    });
}

function dublicateCurrentTab() {
    return getCurrentTab().then(values => {
        browser.tabs.duplicate(values[0].id);
    });
}

function reloadCurrentTab() {
    return getCurrentTab().then(values => {
        browser.tabs.reload(values[0].id);
    });
}

function moveCurrentTabToNewWindow() {
    return getCurrentTab().then(values => {
        browser.windows.create({tabId: values[0].id});
    });
}

function restoreClosedTab() {
    return browser.sessions.getRecentlyClosed({
        maxResults: 1
    }).then(sessionInfos => {
        let sessionInfo = sessionInfos[0];
        if (!sessionInfo) {
            createNewTab();
        } else if (sessionInfo.tab) {
            browser.sessions.restore(sessionInfo.tab.sessionId);
        } else {
            browser.sessions.restore(sessionInfo.window.sessionId);
        }
    });
}

function createNewTab() {
    return browser.tabs.create({});
}

// Zoom commands

function increaseZoom() {
    return browser.tabs.getZoom().then(zoom => {
        if (zoom < 3)
            browser.tabs.setZoom(null, zoom + 0.1);
    });
}

function decreaseZoom() {
    return browser.tabs.getZoom().then(zoom => {
        if (zoom > 0.3)
            browser.tabs.setZoom(null, zoom - 0.1);
    });
}

function resetZoom() {
    return browser.tabs.setZoom(null, 0);
}

// Bookmark commands

function toggleBookmark() {
    return getCurrentTab().then(values => {
        let tab = values[0];
        browser.bookmarks.search({
            url: tab.url
        }).then(bookmarkItems => {
            if (bookmarkItems.length) {
                for (let bookmark of bookmarkItems) {
                    browser.bookmarks.remove(bookmark.id);
                }
            } else {
                browser.bookmarks.create({
                    title: tab.title,
                    url: tab.url
                });
            }
        });
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

function findSelectedText() {
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

function activateTab(query) {
    browser.tabs.update(
        query[0].id, {active: true}
    );
}

function getCurrentTab() {
    return browser.tabs.query({
        active: true, currentWindow: true
    });
}

function getAllTabs() {
    return browser.tabs.query({currentWindow: true});
}