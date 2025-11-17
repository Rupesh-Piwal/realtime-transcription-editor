from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello_world():
    return 'Hello World!'

if __name__ == '__main__':
    app.run(port=4000, debug=True)


# from flask import Flask, jsonify
# from flask_cors import CORS
# from flask_socketio import SocketIO

# # TODO: initialize Flask app
# app = Flask(__name__)

# # TODO: allow frontend origin in CORS (for dev use *)
# CORS(app)

# # TODO: configure SocketIO
# socketio = SocketIO(app, cors_allowed_origins="*")

# @app.route("/health")
# def health():
#     # TODO: return simple json for sanity check
#     return jsonify({"status": "ok"})

# if __name__ == "__main__":
#     # TODO: run with socketio instead of app.run
#     socketio.run(app, host="0.0.0.0", port=5000, debug=True)
