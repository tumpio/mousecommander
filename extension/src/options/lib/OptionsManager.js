/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Options manager for WebExtensions local storage API
 */
function OptionsManager() {
}

OptionsManager.prototype.saveOption = function (option, value) {
    if (typeof value !== "undefined") {
        this.options[option] = value;
    }
    let setObject = {};
    setObject[option] = this.options[option];
    return browser.storage.local.set(setObject);
};

OptionsManager.prototype.loadOptions = function (callback) {
    return browser.storage.local.get()
        .then(result => {
            this.options = {};
            for (let option of Object.keys(result)) {
                this.options[option] = result[option];
            }
        })
        .then(callback);
};

OptionsManager.prototype.reset = function () {
    this.options = {};
    return browser.storage.local.clear();
};

OptionsManager.prototype.importOptions = function (option, optionsImport) {
    let options = [];

    if (Array.isArray(myOptionsManager.options[option])) {
        options = options.concat(myOptionsManager.options[option]);
    }

    if (Array.isArray(optionsImport)) {
        options = options.concat(optionsImport);
    } else {
        options.push(optionsImport);
    }

    myOptionsManager.saveOption(option, options);
};

OptionsManager.prototype.loadDefaultOptions = function () {
    let request = new Request("/default_options.json", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
        mode: "same-origin"
    });
    return Promise.all([myOptionsManager.reset(), fetch(request).then(response => {
        return response.json();
    })]).then(([, options]) => {
        for (let option of Object.keys(options)) {
            this.importOptions(option, options[option]);
        }
        return options;
    });
};
