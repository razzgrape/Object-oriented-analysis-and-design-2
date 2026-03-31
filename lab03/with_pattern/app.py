from flask import Flask, jsonify, request, send_from_directory, send_file
from flask_cors import CORS
from abc import ABC, abstractmethod
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

class MusicIterator(ABC):
    @abstractmethod
    def has_next(self) -> bool: pass

    @abstractmethod
    def next(self) -> Track: pass

    @abstractmethod
    def has_previous(self) -> bool: pass

    @abstractmethod
    def previous(self) -> Track: pass

    @abstractmethod
    def reset(self): pass

    @abstractmethod
    def current_index(self) -> int: pass

    @abstractmethod
    def total(self) -> int: pass

    @abstractmethod
    def current(self) -> Track: pass

class SequentialIterator(MusicIterator):
    def __init__(self, tracks: list[Track]):
        self._tracks = tracks
        self._index = 0

    def has_next(self) -> bool:
        return self._index < len(self._tracks) - 1

    def next(self) -> Track:
        if self._index < len(self._tracks) - 1:
            self._index += 1
        return self._tracks[self._index]

    def has_previous(self) -> bool:
        return self._index > 0

    def previous(self) -> Track:
        if self._index > 0:
            self._index -= 1
        return self._tracks[self._index]

    def reset(self):
        self._index = 0

    def current_index(self) -> int:
        return self._index

    def total(self) -> int:
        return len(self._tracks)

    def current(self) -> Track:
        return self._tracks[self._index]


class ReverseIterator(MusicIterator):
    def __init__(self, tracks: list[Track]):
        self._tracks = tracks
        self._index = len(tracks) - 1

    def has_next(self) -> bool:
        return self._index > 0

    def next(self) -> Track:
        if self._index > 0:
            self._index -= 1
        return self._tracks[self._index]

    def has_previous(self) -> bool:
        return self._index < len(self._tracks) - 1

    def previous(self) -> Track:
        if self._index < len(self._tracks) - 1:
            self._index += 1
        return self._tracks[self._index]

    def reset(self):
        self._index = len(self._tracks) - 1

    def current_index(self) -> int:
        return self._index

    def total(self) -> int:
        return len(self._tracks)

    def current(self) -> Track:
        return self._tracks[self._index]


class ShuffleIterator(MusicIterator):
    def __init__(self, tracks: list[Track]):
        self._tracks = tracks
        self._shuffled = list(tracks)
        random.shuffle(self._shuffled)
        self._index = 0

    def has_next(self) -> bool:
        return self._index < len(self._shuffled) - 1

    def next(self) -> Track:
        if self._index < len(self._shuffled) - 1:
            self._index += 1
        return self._shuffled[self._index]

    def has_previous(self) -> bool:
        return self._index > 0

    def previous(self) -> Track:
        if self._index > 0:
            self._index -= 1
        return self._shuffled[self._index]

    def reset(self):
        random.shuffle(self._shuffled)
        self._index = 0

    def current_index(self) -> int:
        return self._index

    def total(self) -> int:
        return len(self._shuffled)

    def current(self) -> Track:
        return self._shuffled[self._index]

class MusicCollection(ABC):
    @abstractmethod
    def create_iterator(self, mode: str) -> MusicIterator: pass

class Playlist(MusicCollection):
    def __init__(self, name: str):
        self._name = name
        self._tracks: list[Track] = []

    @property
    def name(self) -> str:
        return self._name

    def create_iterator(self, mode: str) -> MusicIterator:
        if mode == "sequential":
            return SequentialIterator(self._tracks)
        elif mode == "reverse":
            return ReverseIterator(self._tracks)
        elif mode == "shuffle":
            return ShuffleIterator(self._tracks)
        else:
            raise ValueError(f"Неизвестный режим: {mode}")

    def add_track(self, track: Track):
        self._tracks.append(track)

    def remove_track(self, index: int):
        if 0 <= index < len(self._tracks):
            self._tracks.pop(index)

    def get_tracks(self) -> list[Track]:
        return list(self._tracks)

COVERS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "covers")
os.makedirs(COVERS_DIR, exist_ok=True)

playlist = Playlist("My Playlist")

playlist.add_track(Track("Roma Enns", "Radmir Renatovich", 300, "Rad.jpg"))
playlist.add_track(Track("Artem Malyutin", "RR", 120, "Rad1.jpg"))
playlist.add_track(Track("Toxis", "NOBODY", 130, "corgi.jpg"))

current_iterator: MusicIterator = playlist.create_iterator("sequential")
is_playing: bool = False


def get_state():
    track = current_iterator.current()
    return {
        "track": track.to_dict(),
        "index": current_iterator.current_index(),
        "total": current_iterator.total(),
        "has_next": current_iterator.has_next(),
        "has_previous": current_iterator.has_previous(),
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
    current_iterator.next()
    is_playing = True
    return jsonify(get_state())

@app.route("/api/previous", methods=["POST"])
def api_previous():
    global is_playing
    current_iterator.previous()
    is_playing = True
    return jsonify(get_state())

@app.route("/api/play", methods=["POST"])
def api_play():
    global is_playing
    is_playing = not is_playing
    return jsonify(get_state())

@app.route("/api/mode/<mode>", methods=["POST"])
def api_mode(mode):
    global current_iterator
    current_iterator = playlist.create_iterator(mode)
    return jsonify(get_state())

@app.route("/api/reset", methods=["POST"])
def api_reset():
    current_iterator.reset()
    return jsonify(get_state())

@app.route("/covers/<filename>")
def serve_cover(filename):
    return send_from_directory(COVERS_DIR, filename)

if __name__ == "__main__":
    print("=" * 50)
    print("  Music Player (Iterator Pattern)")
    print("  http://localhost:5000")
    print("=" * 50)
    app.run(debug=True, port=5000)