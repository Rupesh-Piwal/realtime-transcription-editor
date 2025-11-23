# server/app.py
import os
from flask import Flask
from flask_cors import CORS
from flask_sock import Sock

from .config import Config
from .db import close_db
from .api import api_bp
from .ws.transcription_ws import init_ws

def create_app(test_config=None):
    """Create and configure an instance of the Flask application."""
    app = Flask(__name__, instance_relative_config=True)
    
    # Load configuration
    if test_config is None:
        app.config.from_object(Config)
    else:
        app.config.from_mapping(test_config)

    # Ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass
        
    # Ensure recordings directory exists
    recordings_dir = app.config['RECORDINGS_DIR']
    if not os.path.exists(recordings_dir):
        os.makedirs(recordings_dir)

    # Initialize extensions
    CORS(app)  # Enable CORS for all routes
    sock = Sock(app) # Initialize Flask-Sock

    # Register blueprints
    app.register_blueprint(api_bp)
    
    # Initialize WebSocket routes
    from .ws import transcription_ws
    transcription_ws.init_ws(sock)

    # Register teardown function to close DB connection
    app.teardown_appcontext(close_db)

    @app.route('/health')
    def health_check():
        return "Server is running"

    return app

# To run the app directly (for development)
if __name__ == '__main__':
    app = create_app()
    # Note: Use a production-ready WSGI server like Gunicorn or uWSGI for deployment
    # The development server is not suitable for production.
    app.run(debug=True, port=5000)