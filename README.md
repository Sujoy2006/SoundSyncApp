# Audio Reactive Particle Orb

A stunning, real-time audio reactive 3D particle orb built with WebGL (Three.js). This visualizer dynamically responds to microphone or internal tab audio, creating a mesmerizing, holographic music visualizer right in your browser.

## Features

- **Real-time Audio Reactivity:** Responds seamlessly to bass, treble, and volume inputs.
- **Customizable Color Palettes:** Choose from 12+ pre-built high-contrast premium color palettes or build your own custom gradient with up to 5 colors!
- **Auto-Cycling:** Enable the Auto-Cycle toggle to smoothly morph through different visual themes automatically over time.
- **Advanced Particle Controls:** 
  - **Size:** Adjust the thickness of the particles.
  - **Reactivity:** Control how aggressively the orb reacts to the music.
  - **Glow:** Dial up the additive blending for a neon, high-energy look or turn it down for a subtle, ethereal vibe.
  - **Rotation Speed:** Make the orb spin like a vinyl record or stay completely still.
  - **Anim Speed & Chaos Jump:** Manipulate the internal noise algorithms for varied movement.
  - **Density:** Drop the number of particles for a wireframe look, or maximize it for a solid glowing sphere.
- **Inner Audio Support:** Grab audio directly from a browser tab or system audio (instead of just the microphone) for pure, crystal-clear reactivity without background noise.

## How to Run

Since this project relies on accessing the microphone and using modern browser APIs, it is highly recommended to run it over a local server rather than just opening the HTML file directly.

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd <your-repo-directory>
   ```

2. **Serve the directory:**
   If you have Python installed, you can easily spin up a local server:
   ```bash
   python3 -m http.server 8000
   ```
   *Or use any other local server like Node's `http-server` or the VSCode Live Server extension.*

3. **Open in Browser:**
   Navigate to `http://localhost:8000` in your modern web browser (Google Chrome is highly recommended for full Web Audio API support).

## Usage Guide

1. Click the **Start Sync** button at the bottom of the screen.
2. Grant microphone permissions when prompted.
3. If you want to use system or tab audio instead of the microphone:
   - Click the gear icon in the top right to open **Settings**.
   - Toggle **Inner Audio (Tab)** ON.
   - Click **Start Sync** and choose the tab playing your music from the browser popup.
4. Play your favorite music and enjoy the visualizer! Use the settings menu to tweak colors and particle physics in real-time.

## Technologies Used
- HTML5 / CSS3 / JavaScript
- [Three.js](https://threejs.org/) (WebGL 3D Rendering)
- [Tailwind CSS](https://tailwindcss.com/) (Rapid UI Styling)
- Web Audio API & MediaDevices API

## License
MIT License. Feel free to use and modify for your own projects!
