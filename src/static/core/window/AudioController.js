/**
 * Actify Audio Controller
 * Compact audio player with essential controls
 * @version 1.0.0
 */

class ActifyAudio {
  constructor(options = {}) {
    // Configuration
    this.config = {
      volume: 0.7,
      muted: false,
      loop: false,
      autoplay: false,
      ...options
    };

    // Audio element
    this.audio = new Audio();
    this.audio.volume = this.config.volume;
    this.audio.loop = this.config.loop;

    // State
    this._isPlaying = false;
    this._currentTrack = null;
    this._playlist = [];
    this._currentIndex = -1;

    // Initialize
    this._setupEvents();
  }

  // Core Methods
  load(src) {
    this._currentTrack = src;
    this.audio.src = src;
    return this;
  }

  play() {
    this.audio.play()
      .then(() => this._isPlaying = true)
      .catch(e => console.error('Playback failed:', e));
    return this;
  }

  pause() {
    this.audio.pause();
    this._isPlaying = false;
    return this;
  }

  togglePlay() {
    this._isPlaying ? this.pause() : this.play();
    return this;
  }

  stop() {
    this.pause();
    this.audio.currentTime = 0;
    return this;
  }

  seek(time) {
    this.audio.currentTime = time;
    return this;
  }

  setVolume(level) {
    this.config.volume = Math.min(1, Math.max(0, level));
    this.audio.volume = this.config.muted ? 0 : this.config.volume;
    return this;
  }

  mute() {
    this.config.muted = true;
    this.audio.volume = 0;
    return this;
  }

  unmute() {
    this.config.muted = false;
    this.audio.volume = this.config.volume;
    return this;
  }

  toggleMute() {
    this.config.muted ? this.unmute() : this.mute();
    return this;
  }

  // Playlist Management
  addTrack(src) {
    this._playlist.push(src);
    if (this._currentIndex === -1) this._currentIndex = 0;
    return this;
  }

  next() {
    if (this._playlist.length === 0) return this;
    this._currentIndex = (this._currentIndex + 1) % this._playlist.length;
    this.load(this._playlist[this._currentIndex]);
    if (this._isPlaying) this.play();
    return this;
  }

  prev() {
    if (this._playlist.length === 0) return this;
    this._currentIndex = (this._currentIndex - 1 + this._playlist.length) % this._playlist.length;
    this.load(this._playlist[this._currentIndex]);
    if (this._isPlaying) this.play();
    return this;
  }

  // Getters
  get duration() {
    return this.audio.duration;
  }

  get currentTime() {
    return this.audio.currentTime;
  }

  get isPlaying() {
    return this._isPlaying;
  }

  get currentTrack() {
    return this._currentTrack;
  }

  // Event Handling
  on(event, callback) {
    this.audio.addEventListener(event, callback);
    return this;
  }

  _setupEvents() {
    this.audio.addEventListener('ended', () => {
      this._isPlaying = false;
      if (this._playlist.length > 0) this.next();
    });

    if (this.config.autoplay) {
      this.audio.addEventListener('canplay', () => this.play(), { once: true });
    }
  }
}

// Usage Example:
// const player = new ActifyAudio({ volume: 0.8 });
// player.load('audio.mp3').play();
// player.addTrack('song2.mp3').addTrack('song3.mp3');
// player.next();
