# server/utils/time_utils.py
import time

def get_current_timestamp_ms():
    """Returns the current time in milliseconds since the epoch."""
    return int(time.time() * 1000)
