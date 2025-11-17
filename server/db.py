import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def get_db():
    """
    Returns a connection to the MongoDB database.
    """
    try:
        mongo_uri = os.environ.get("MONGO_URI")
        if not mongo_uri:
            raise ValueError("MONGO_URI environment variable not set")
            
        client = MongoClient(mongo_uri)
        db = client.get_default_database() # Or specify a database name like client['your_db_name']
        return db
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        return None
