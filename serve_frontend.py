import http.server
import socketserver
import os
import webbrowser
import shutil

PORT = 3000
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), 'build')

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=FRONTEND_DIR, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def list_directory(self, path):
        self.send_error(403, "Directory listing is forbidden.")
        return None

    def do_POST(self):
        self.send_error(405, "POST method not allowed.")

    def log_message(self, format, *args):
        return

    def copyfile(self, source, outputfile):
        try:
            shutil.copyfileobj(source, outputfile)
        except (ConnectionResetError, ConnectionAbortedError):
            print("⚠️ Client ne connection bich me hi band kar diya.")
            pass

os.chdir(FRONTEND_DIR)
print(f"✅ Frontend server running at http://localhost:{PORT}")
webbrowser.open(f"http://localhost:{PORT}")

with socketserver.TCPServer(("127.0.0.1", PORT), CustomHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server band kiya by user.")
