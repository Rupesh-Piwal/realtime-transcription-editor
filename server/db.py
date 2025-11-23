# server/db.py
from pymongo import MongoClient
from flask import current_app, g

def get_db():
    """
    Connect to the application's configured database.
    If the connection does not exist, it is created and stored in the application context.
    """
    if 'db' not in g:
        client = MongoClient(current_app.config['MONGO_URI'])
        g.db = client.get_database()
    return g.db

def close_db(e=None):
    """
    If a connection was created, close it.
    """
    db = g.pop('db', None)
    if db is not None:
        # Pymongo's client object manages connections, so we don't strictly need to close it.
        # This function is here for symmetry with Flask patterns.
        pass
