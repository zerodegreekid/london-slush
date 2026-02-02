#!/usr/bin/env python3
from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

os.chdir('/home/user/webapp')
server = HTTPServer(('0.0.0.0', 8766), CORSRequestHandler)
print("Server running on http://0.0.0.0:8766")
print(f"Download: http://0.0.0.0:8766/london-slush-cloudflare-upload.zip")
server.serve_forever()
