# SoundSync 🎧🌌

> A futuristic real-time audio-reactive desktop visualizer built with Electron and Three.js.

SoundSync transforms audio into a dynamic 3D particle orb experience. It dynamically reacts to both **microphone/environment audio** (Outer Audio) and **system/desktop output audio** (Inner Audio) via Linux PipeWire capture.

---

## 🌟 Overview

SoundSync is a dedicated audio visualizer application for Linux desktops. Using WebGL shaders via Three.js, it translates frequency spectrum analysis and amplitude into dynamic particle movement, color shifts, and turbulence in real time.

---

## 📦 Installation

### 🤔 Which Installation Method Should I Use?

- **Debian / Ubuntu (`.deb`)** *(Recommended)*: Best for Ubuntu, Debian, Linux Mint, Pop!_OS, and derivative distribution users who want a standard installed desktop application with full system integration and application menu shortcuts.
- **AppImage** *(Alternative)*: Best for users on Arch Linux, Fedora, openSUSE, or any distribution who prefer a standalone, portable application without traditional system package installation.

---

## 🐧 Recommended: Debian / Ubuntu (.deb)

Follow these step-by-step instructions to install SoundSync using the official `.deb` package:

### Step 1 — Open the SoundSync Repository
Open the official [SoundSync GitHub Repository](https://github.com/Sujoy2006/SoundSyncApp) in your web browser.

### Step 2 — Open Releases & Download Package
1. On the right side of the repository page, click on **Releases**.
2. Locate the latest SoundSync v1.0.0 release.
3. Under the **Assets** section of the release, click on `soundsync_1.0.0_amd64.deb` to download it to your computer.

### Step 3 — Open Terminal & Navigate to Downloads
Open your Linux terminal and navigate to your `Downloads` directory:
```bash
cd ~/Downloads
```

### Step 4 — Check the Downloaded Package
Verify that the package file exists in your Downloads directory:
```bash
ls
```
You should see `soundsync_1.0.0_amd64.deb` listed in the terminal output.

### Step 5 — Install SoundSync
Run the following installation command:
```bash
sudo apt install ./soundsync_1.0.0_amd64.deb
```
*Note: The terminal will prompt you to enter your administrator (sudo) password to complete the package installation.*

### Step 6 — Launch SoundSync
Once installation finishes, launch SoundSync from your application launcher or desktop environment menu:
```text
Applications → SoundSync
```

### Step 7 — Verify Installation
- SoundSync launches in a sleek, frameless desktop window.
- The SoundSync branding logo appears in your system dock/taskbar.
- The 3D audio-reactive orb initializes in the center of the screen.
- Click **Start Sync** to begin audio reactivity.

---

## 📦 Alternative: AppImage

If you prefer a portable executable that runs without installation:

1. Open the [SoundSync GitHub Releases](https://github.com/Sujoy2006/SoundSyncApp/releases) page in your browser.
2. Under **Assets**, download `SoundSync-1.0.0.AppImage`.
3. Open your terminal and navigate to your `Downloads` folder:
   ```bash
   cd ~/Downloads
   ```
4. Grant execution permissions to the AppImage:
   ```bash
   chmod +x ./SoundSync-1.0.0.AppImage
   ```
5. Launch SoundSync directly:
   ```bash
   ./SoundSync-1.0.0.AppImage
   ```

---

## ✨ Key Features

### 🎤 Outer Audio Sync Mode
Captures audio from your microphone or environment input.
- Real-time amplitude & FFT spectrum analysis.
- Adaptive sensitivity and dynamic frequency mapping.
- Audio-reactive particle displacement.

### 🔊 Inner Audio Sync Mode
Captures system output audio directly (desktop sound, YouTube, Spotify, games, media players).
- **PipeWire Integration**: Uses Linux PipeWire `pw-record` audio capture to isolate system output.
- **Microphone Isolation**: Designed to react purely to desktop output while excluding room noise/microphone feedback.

### 🌌 Real-Time Orb Visualization
- **65,000 Dynamic Particles**: Rendered using custom WebGL vertex and fragment shaders.
- **Audio Reactivity Metrics**: Distinct uniform updates driving volume, bass pulse, treble shimmer, and chaos turbulence.
- **Smooth Audio Smoothing**: Adaptive exponential smoothing factor for responsive audio reactivity.

### 🎨 Color Palettes & Customization
Includes 11 curated high-contrast gradient palettes plus a Custom Palette mode:
- **Cyber Glow**
- **Matrix Green**
- **Supernova**
- **Crimson Pulse**
- **Cyber Amber**
- **Neon Glacier**
- **Molten Copper**
- **Cobalt Blue**
- **Solar Eclipse**
- **Acid Venom**
- **Royal Amethyst**
- **Custom Mode**: User-definable gradient supporting up to **4 custom colors** with native color pickers.
- **Auto-Cycle Mode**: Smoothly morphs between themes over time at adjustable cycle speeds.

### ⚙️ Particle Dynamics & Customization
Tune visual behavior in real time:
- **Orb Sensitivity**: Adjust audio reaction multiplier (0.1x to 5.0x).
- **Particle Size**: Control point thickness.
- **Particle Glow**: Adjust additive blending glow intensity.
- **Rotation Speed**: Spin speed of the orb visualization.
- **Animation Speed & Chaos Jump**: Adjust internal procedural noise algorithms.
- **Density**: Adjust active particle count draw range.

### 🖥️ Custom Window Chrome
- **Frameless Window**: Custom dark title bar (`frame: false`).
- **Native IPC Window Controls**: Minimal `Settings` (⚙), `Minimize` (─), `Maximize/Restore` (⛶), and `Close` (×) buttons communicating via Electron IPC.
- **Window Dragging**: Smooth `-webkit-app-region: drag` support.

### 💤 Automatic Control Standby
- **Idle Auto-Hide**: Start/Stop Sync control container automatically fades out after 3 seconds of cursor inactivity (`3000ms`) and smoothly restores on mouse movement.

---

## 🎮 Controls & Interface

| Control | Action / Behavior |
|---------|-------------------|
| **Start / Stop Sync** | Toggles audio capture and visualizer activity. |
| **Settings (⚙)** | Opens the glassmorphic Settings panel for audio mode, palettes, and dynamics. |
| **Minimize (─)** | Minimizes SoundSync to the desktop panel/dock via native IPC. |
| **Maximize / Restore (⛶)** | Toggles native Electron window maximize state. |
| **Close (×)** | Closes the SoundSync application. |
| **Custom Title Bar** | Click and drag anywhere on the top bar to move the window. |
| **Mouse Standby** | Leave cursor idle for 3 seconds to auto-hide bottom sync controls. |

---

## 🛠️ Technology Stack

- **Framework**: Electron `^44.4.2`
- **3D Visualization Engine**: Three.js (`r128`) WebGL
- **Audio Capture & Analysis**: Web Audio API (FFT / AnalyserNode) + Linux PipeWire (`pw-record`)
- **UI & Styling**: HTML5, Vanilla CSS3 (Glassmorphism), Tailwind CSS
- **Packaging & Build**: `electron-builder` `^26.15.3` (AppImage & Debian `.deb`)

---

## 🏗️ Architecture

```text
                               SoundSync (Electron v44)
                                          │
                     ┌────────────────────┴────────────────────┐
                     │                                         │
            Outer Audio Sync                          Inner Audio Sync
         (Microphone / Input)                      (Linux PipeWire / System)
                     │                                         │
                     └────────────────────┬────────────────────┘
                                          │
                                   Web Audio API
                             (AnalyserNode FFT / RMS)
                                          │
                     ┌────────────────────┼────────────────────┐
                     │                    │                    │
                  Volume                 Bass                Treble
                     │                    │                    │
                     └────────────────────┼────────────────────┘
                                          │
                                  Orb Audio Metrics
                                          │
                                          ▼
                               Three.js WebGL Shaders
                              (65,000 Point Particles)
                                          │
                                          ▼
                                   🌌 Reactive Orb
```

---

## 🐧 Linux Audio Architecture

On Linux systems, Inner Audio mode leverages PipeWire's native audio graph:
- **Capture Command**: Spawns `pw-record --target <monitor_sink>` process asynchronously.
- **Audio Isolation**: Direct stream routing isolates system output, enabling reactive visualizer sync without microphone noise spill.

---

## 🖥️ Supported Platforms

- **Linux (x64)**: Fully supported (PipeWire integration, AppImage, `.deb`).
- **Windows / macOS**: Planned in future roadmap updates (currently Linux-focused).

---

## 📁 Project Structure

```text
SoundSync/
├── main.js             # Electron main process (BrowserWindow, frame: false, IPC)
├── index.html          # HTML structure, title bar, settings modal & control UI
├── style.css           # Design system, glassmorphic UI, animations & layout
├── script.js           # Three.js scene, WebGL shaders, PipeWire audio analyzer
├── icon.png            # High-resolution transparent application logo
├── package.json        # Node dependencies, scripts & electron-builder targets
├── package-lock.json   # Locked dependency tree
├── .gitignore          # Excludes dist/, node_modules/, and temporary artifacts
├── build/              # Icon set for Linux package builds (16x16 ... 512x512)
└── README.md           # Project documentation
```

> *Note: `dist/` and `node_modules/` are build/runtime directories ignored by Git.*

---

## 🗺️ Roadmap

- [ ] Windows system audio loopback capture integration.
- [ ] Additional WebGL visualizer shapes (Wave ribbons, Nebula rings).
- [ ] Custom keybindings & global media key hotkeys.
- [ ] User profile persistence for custom color palettes & particle defaults.

---

## 📷 Screenshots

*Screenshots will be added in a future documentation update.*

---

## 📄 License

*Licensing information has not yet been added to this repository.*