import http.server
import socketserver
import os
import webbrowser
import shutil
import json
import random
import time

try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

PORT = 3000
FRONTEND_DIR = os.path.dirname(os.path.abspath(__file__))

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    # Fix MIME types for proper rendering
    extensions_map = {
        '': 'application/octet-stream',
        '.html': 'text/html',
        '.htm': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.xml': 'application/xml',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'font/otf',
        '.txt': 'text/plain',
        '.md': 'text/markdown',
        '.pdf': 'application/pdf',
    }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=FRONTEND_DIR, **kwargs)

    def do_GET(self):
        # Serve /api/stats
        if self.path == '/api/stats':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            
            if PSUTIL_AVAILABLE:
                cpu = psutil.cpu_percent(interval=None)
                ram = psutil.virtual_memory()
                stats = {
                    "cpu_percent": cpu,
                    "ram_percent": ram.percent,
                    "ram_used_gb": round(ram.used / (1024**3), 2),
                    "ram_total_gb": round(ram.total / (1024**3), 2),
                    "softchip_mode": "BURST" if cpu > 50 else "IDLE"
                }
            else:
                # Mock if psutil missing
                stats = {
                    "cpu_percent": random.randint(5, 30),
                    "ram_percent": random.randint(30, 60),
                    "ram_used_gb": 4.2,
                    "ram_total_gb": 16.0,
                    "softchip_mode": "SIMULATION"
                }
            
            self.wfile.write(json.dumps(stats).encode())
            return

        # Default static file serving
        return super().do_GET()

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
            pass

os.chdir(FRONTEND_DIR)
print(f"✅ Frontend server running at http://localhost:{PORT}")
if not PSUTIL_AVAILABLE:
    print("⚠️  'psutil' module not found. Using simulated data.")

# Allow reuse of address to prevent "Address already in use" errors
socketserver.TCPServer.allow_reuse_address = True

with socketserver.TCPServer(("0.0.0.0", PORT), CustomHandler) as httpd:
    # Open browser only if not reloaded (simple check, or just always open)
    # webbrowser.open(f"http://localhost:{PORT}") 
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped.")
