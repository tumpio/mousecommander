Mouse Commander - A Firefox extension
============================================

A Firefox extension to map mouse button events or a sequence of events
to common browser actions.

**Important:** This extension requires installation of a client
application for listening of mouse events and messaging them to the
extension using the `Native Messaging`_ Firefox Extension API.

Features
--------

Trigger a browser action on a mouse button event and wheter other mouse
buttons are hold down, or with a sequence of mouse button events.

For example, it's possible to switch between tabs with mouse wheel:

- Wheel up + Secondary down -> Change to next tab
- wheel down + Secondary down -> Change to previous tab

Examples of mouse button events in sequence to trigger browser actions:

- Double secondary click -> Open new tab
- Secondary click + Secondary long press -> Duplicate tab

Supported mouse button events
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
- Button Down
- Button Up
- Button Long Press
- Wheel Up
- Wheel Down

Supported mouse buttons
^^^^^^^^^^^^^^^^^^^^^^^
- Primary mouse button
- Secondary mouse button
- Middle mouse button

Supported browser actions
^^^^^^^^^^^^^^^^^^^^^^^^^
- Switch to next tab
- Switch to previous tab
- Restore last active tab
- Close tab
- Close other tabs
- Close tabs on left
- Close tabs on right
- Toggle tab pinning
- Duplicate tab
- Reload page
- Back in history
- Forward in history
- Move tab to new window
- Restore closed tab
- Create new tab
- Increase page zoom
- Decrease page zoom
- Reset page zoom
- Scroll top
- Scroll bottom
- Highlight selected text
- Toggle page bookmark
- Toggle reader mode

Development
~~~~~~~~~~~

Requirements: Python 3.6, pipenv, npm

Clone the repository and install python 3.6, npm and pipenv.

Create development environment running:

::

    npm install && pipenv install

Build client application (fbs freeze):

::

    npm run build

Setup `Native messaging manifest`_ depending on your OS
and set the path property to point to the client application in target folder.

E.g. for linux manifest file:

::

"path": "<path_to_cloned_repository>/app/target/mousecommander/mousecommander"

Start extension and client application in Firefox:

::

    npm start

Creating installer
~~~~~~~~~~~~~~~~~~

For Windows:

- Install `NSIS`_ and `NsJSON`_ plugin (extract plugin to ``%programs%\NSIS\Plugins``)
- Install `Windows 10 SDK`_ (Windows 10 only)

For Linux:

- Install `fpm`_


For Mac:

- ???

After above setup, create installer by running:

::

    pipenv shell
    cd app
    fbs freeze
    fbs installer

License
~~~~~~~
Extension is licensed under the MPL-2.0.
Application is licensed under the GPLv3.

.. _Native Messaging: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_messaging
.. _Native messaging manifest: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_manifests#Native_messaging_manifests
.. _NSIS: https://nsis.sourceforge.io/Download
.. _NsJSON: https://nsis.sourceforge.io/NsJSON_plug-in
.. _Windows 10 SDK: https://developer.microsoft.com/en-us/windows/downloads/windows-10-sdk
.. _fpm: https://fpm.readthedocs.io/en/latest/installing.html
