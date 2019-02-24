Mouse Commander Native - A Firefox extension
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

- Mouse wheel up + Secondary mouse button down -> Change to next tab
- Mouse wheel down + Secondary mouse button down -> Change to previous tab

A sequence of mouse button events is a combination of multiple mouse
button events (button down/up/long press and wheel up/down).

Examples of mouse button event sequences to trigger browser actions:

- Secondary button double click -> Open new tab
- Secondary button click + Secondary button long press -> Duplicate tab

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
- Close tab
- Close other tabs
- Close tabs on left
- Close tabs on right
- Duplicate tab
- Reload page
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

Development
~~~~~~~~~~~

Requirements: Python 3.6, pyunput, Python for Qt, fbs

Clone the repository and install npm and pipenv.

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

"path": "<path_to_cloned_repository>/app/target/mouse_commander/mouse_commander"

Start extension and client application in Firefox:

::

    npm start

License
~~~~~~~
::

    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at http://mozilla.org/MPL/2.0/.

.. _Native Messaging: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_messaging
.. _Native messaging manifest: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_manifests#Native_messaging_manifests
