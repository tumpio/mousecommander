import json
import struct
import sys
import threading
from queue import Queue
from typing import Callable, Any

from PySide2.QtCore import Signal, QThread
from PySide2.QtGui import QIcon
from PySide2.QtWidgets import QMenu, QAction, QSystemTrayIcon
from fbs_runtime.application_context import ApplicationContext, cached_property
from pynput.mouse import Listener, Button

name = 'mouse_commander'

MESSAGE_QUEUE = Queue(10)
MESSAGE_ENCODING = "utf-8"

MESSAGE_BUTTON = {
    Button.left: bytes("0", MESSAGE_ENCODING),
    Button.middle: bytes("1", MESSAGE_ENCODING),
    Button.right: bytes("2", MESSAGE_ENCODING),
}

MESSAGE_FALSE = bytes("0", MESSAGE_ENCODING)
MESSAGE_TRUE = bytes("1", MESSAGE_ENCODING)
MESSAGE_BUTTON_DOWN = MESSAGE_TRUE
MESSAGE_BUTTON_UP = MESSAGE_FALSE
MESSAGE_SCROLL_DOWN = MESSAGE_TRUE
MESSAGE_SCROLL_UP = MESSAGE_FALSE

MESSAGE_STRING_DELIMITER = bytes("\"", MESSAGE_ENCODING)
MESSAGE_CLICK_LENGTH = struct.pack('@I', 5)
MESSAGE_CLICK_PREFIX = bytes("c", MESSAGE_ENCODING)
MESSAGE_SCROLL_LENGTH = struct.pack('@I', 4)
MESSAGE_SCROLL_PREFIX = bytes("s", MESSAGE_ENCODING)


class NativeMessageListener(threading.Thread):

    def run(self):
        while True:
            data = sys.stdin.buffer.raw.read(4)
            if not data:
                break
            message_length = struct.unpack('@I', data)[0]
            message = json.loads(sys.stdin.buffer.raw.read(message_length).decode(MESSAGE_ENCODING))
            MESSAGE_QUEUE.put(message)


class NativeMessageConsumer(QThread):
    start_signal = Signal()

    def stop(self):
        MESSAGE_QUEUE.put(0)
        self.wait()

    def run(self):
        while True:
            message = MESSAGE_QUEUE.get()
            if message == 0:
                break
            elif message == "start_signal":
                self.start_signal.emit()


class SystemTrayMenu(QMenu):

    @cached_property
    def enable_action(self):
        action = QAction(self.tr("Enable"), self)
        action.setCheckable(True)
        return action

    @cached_property
    def info_action(self):
        return QAction(self.tr("Info"), self)

    @cached_property
    def quit_action(self):
        return QAction(self.tr("Quit"), self)

    def __init__(self, action_enable: Callable[[bool], Any], action_info: callable, action_quit: callable, *__args):
        super().__init__(*__args)
        self.addAction(self.enable_action)
        self.addAction(self.info_action)
        self.addAction(self.quit_action)
        self.enable_action.triggered.connect(lambda: action_enable(self.enable_action.isChecked()))
        self.info_action.triggered.connect(action_info)
        self.quit_action.triggered.connect(action_quit)


class AppContext(ApplicationContext):

    def __init__(self):
        super().__init__()
        self.running = False
        self.mouse_listener = None
        self.message_listener = None
        self.message_handler = None

    @cached_property
    def tray_menu(self):
        return SystemTrayMenu(self.set_state, None, self.quit)

    @staticmethod
    def on_click(x, y, button, pressed):
        if button not in MESSAGE_BUTTON:
            return
        sys.stdout.buffer.write(MESSAGE_CLICK_LENGTH)
        sys.stdout.buffer.write(MESSAGE_STRING_DELIMITER)
        sys.stdout.buffer.write(MESSAGE_CLICK_PREFIX)
        sys.stdout.buffer.write(MESSAGE_BUTTON_DOWN if pressed else MESSAGE_BUTTON_UP)
        sys.stdout.buffer.write(MESSAGE_BUTTON[button])
        sys.stdout.buffer.write(MESSAGE_STRING_DELIMITER)
        sys.stdout.buffer.flush()

    @staticmethod
    def on_scroll(x, y, dx, dy):
        sys.stdout.buffer.write(MESSAGE_SCROLL_LENGTH)
        sys.stdout.buffer.write(MESSAGE_STRING_DELIMITER)
        sys.stdout.buffer.write(MESSAGE_SCROLL_PREFIX)
        sys.stdout.buffer.write(MESSAGE_SCROLL_DOWN if dy > 0 else MESSAGE_SCROLL_UP)
        sys.stdout.buffer.write(MESSAGE_STRING_DELIMITER)
        sys.stdout.buffer.flush()

    def run(self):
        self.app.setQuitOnLastWindowClosed(False)
        tray = QSystemTrayIcon()
        tray.setContextMenu(self.tray_menu)
        tray.setIcon(QIcon(context.get_resource("icon.svg")))
        tray.setVisible(True)
        self.message_handler = NativeMessageConsumer(self.app)
        self.message_handler.start_signal.connect(self.start)
        self.message_listener = NativeMessageListener(daemon=True)
        self.message_handler.start()
        self.message_listener.start()
        return self.app.exec_()

    def set_state(self, enabled: bool):
        if enabled:
            self.start()
        else:
            self.stop()

    def start(self):
        if not self.running:
            self.running = True
            self.mouse_listener = Listener(on_click=self.on_click, on_scroll=self.on_scroll)
            self.mouse_listener.start()
            self.tray_menu.enable_action.setChecked(True)

    def stop(self):
        if self.running:
            if self.mouse_listener:
                self.mouse_listener.stop()
                self.mouse_listener = None
            self.tray_menu.enable_action.setChecked(False)
            self.running = False

    def quit(self):
        self.stop()
        self.message_handler.stop()
        self.message_handler.terminate()
        self.app.quit()


if __name__ == '__main__':
    context = AppContext()
    exit_code = context.run()
    sys.exit(exit_code)
