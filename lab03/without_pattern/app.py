from flask import Flask, jsonify, request, send_from_directory, send_file
from flask_cors import CORS
import random
import os

app = Flask(__name__, static_folder="static")
CORS(app)

class Track:
    def __init__(self, title: str, artist: str, duration: int, cover: str = ""):
        self.title = title
        self.artist = artist
        self.duration = duration
        self.cover = cover

    def to_dict(self):
        return {
            "title": self.title,
            "artist": self.artist,
            "duration": self.duration,
            "duration_str": f"{self.duration // 60}:{self.duration % 60:02d}",
            "cover": self.cover
        }

class Playlist:
    def __init__(self, name: str):
        self._name = name
        self._tracks: list[Track] = []
        self._index: int = 0
        self._mode: str = "sequential"
        self._shuffled: list[Track] = []

    @property
    def name(self) -> str:
        return self._name

    def add_track(self, track: Track):
        self._tracks.append(track)

    def remove_track(self, index: int):
        if 0 <= index < len(self._tracks):
            self._tracks.pop(index)

    def get_tracks(self) -> list[Track]:
        return list(self._tracks)

    def set_mode(self, mode: str):
        if mode not in ("sequential", "reverse", "shuffle"):
            raise ValueError(f"Неизвестный режим: {mode}")
        self._mode = mode
        self._index = 0
        if mode == "shuffle":
            self._shuffled = list(self._tracks)
            random.shuffle(self._shuffled)
        elif mode == "reverse":
            self._index = len(self._tracks) - 1

    def _active_list(self) -> list[Track]:
        if self._mode == "shuffle":
            return self._shuffled
        return self._tracks

    def has_next(self) -> bool:
        if self._mode == "reverse":
            return self._index > 0
        return self._index < len(self._active_list()) - 1

    def next(self) -> Track:
        if self._mode == "reverse":
            if self._index > 0:
                self._index -= 1
        else:
            if self._index < len(self._active_list()) - 1:
                self._index += 1
        return self._active_list()[self._index]

    def has_previous(self) -> bool:
        if self._mode == "reverse":
            return self._index < len(self._tracks) - 1
        return self._index > 0

    def previous(self) -> Track:
        if self._mode == "reverse":
            if self._index < len(self._tracks) - 1:
                self._index += 1
        else:
            if self._index > 0:
                self._index -= 1
        return self._active_list()[self._index]

    def current(self) -> Track:
        return self._active_list()[self._index]

    def current_index(self) -> int:
        return self._index

    def total(self) -> int:
        return len(self._tracks)

    def reset(self):
        if self._mode == "shuffle":
            random.shuffle(self._shuffled)
        self._index = 0 if self._mode != "reverse" else len(self._tracks) - 1

COVERS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "covers")
os.makedirs(COVERS_DIR, exist_ok=True)

playlist = Playlist("My Playlist")

playlist.add_track(Track("Roma Enns", "Radmir Renatovich", 300, "Rad.jpg"))
playlist.add_track(Track("Artem Malyutin", "RR", 120, "Rad1.jpg"))
playlist.add_track(Track("Toxis", "NOBODY", 130, "corgi.jpg"))

is_playing: bool = False


def get_state():
    track = playlist.current()
    return {
        "track": track.to_dict(),
        "index": playlist.current_index(),
        "total": playlist.total(),
        "has_next": playlist.has_next(),
        "has_previous": playlist.has_previous(),
        "is_playing": is_playing,
        "playlist_name": playlist.name,
        "tracks": [t.to_dict() for t in playlist.get_tracks()],
    }

@app.route("/")
def index():
    return send_file("static/index.html")


@app.route("/api/state")
def api_state():
    return jsonify(get_state())


@app.route("/api/next", methods=["POST"])
def api_next():
    global is_playing
    playlist.next()
    is_playing = True
    return jsonify(get_state())


@app.route("/api/previous", methods=["POST"])
def api_previous():
    global is_playing
    playlist.previous()
    is_playing = True
    return jsonify(get_state())


@app.route("/api/play", methods=["POST"])
def api_play():
    global is_playing
    is_playing = not is_playing
    return jsonify(get_state())


@app.route("/api/mode/<mode>", methods=["POST"])
def api_mode(mode):
    playlist.set_mode(mode)
    return jsonify(get_state())


@app.route("/api/reset", methods=["POST"])
def api_reset():
    playlist.reset()
    return jsonify(get_state())


@app.route("/covers/<filename>")
def serve_cover(filename):
    return send_from_directory(COVERS_DIR, filename)


if __name__ == "__main__":
    print("=" * 50)
    print("  Music Player (БЕЗ паттерна)")
    print("  http://localhost:5000")
    print("=" * 50)
    app.run(debug=True, port=5000)