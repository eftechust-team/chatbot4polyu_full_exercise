from flask import Flask, render_template, send_from_directory
import os

app = Flask(__name__)

# Serve static files (CSS, JS)
@app.route('/static/<path:filename>')
def send_static(filename):
    return send_from_directory('static', filename)

# Serve index.html as the welcome page
@app.route('/')
@app.route('/index.html')
def home():
    print("[route] home -> index.html", flush=True)
    return send_from_directory('.', 'index.html')

# Serve form.html (meal tracking)
@app.route('/form.html')
def form_page():
    print("[route] form_page -> form.html", flush=True)
    return send_from_directory('.', 'form.html')

# Serve any other HTML files
@app.route('/<path:filename>')
def serve_file(filename):
    if filename.endswith('.html') or filename.endswith('.css') or filename.endswith('.js'):
        return send_from_directory('.', filename)
    return send_from_directory('.', filename), 404

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
