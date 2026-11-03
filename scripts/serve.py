"""Loopback-only static server with a process-lifetime lock; no root needed."""
import fcntl
import functools
import http.server
import os
from pathlib import Path

state = Path(os.environ.get('SHOT_STATE_DIR', str(Path.home() / '.local' / 'share' / 'shot')))
state.mkdir(parents=True, exist_ok=True)
lock = (state / 'server.lock').open('a')
try:
    fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
except BlockingIOError:
    raise SystemExit(0)

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

root = Path(os.environ.get('SHOT_WEB_DIR', str(Path.home() / 'shot-web')))
if not (root / 'index.html').is_file():
    raise SystemExit('Missing ~/shot-web/index.html')
server = http.server.ThreadingHTTPServer(
    ('127.0.0.1', int(os.environ.get('SHOT_PORT', '8001'))), functools.partial(Handler, directory=str(root)))
print(f'SHOT listening on 127.0.0.1:{server.server_port}', flush=True)
server.serve_forever()
