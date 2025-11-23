# server/ws/__init__.py
from flask import Blueprint

ws_bp = Blueprint('ws', __name__, url_prefix='/ws')

from . import transcription_ws
