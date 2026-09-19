const syncBtn = document.getElementById('sync-btn');
        const syncBtnText = document.getElementById('sync-btn-text');
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        const remoteAudio = document.getElementById('remote-audio');

        let audioContext;
        let analyser;
        let dataArray;
        let isAudioInitialized = false;
        let outerStream = null;
        let outerSource = null;
        let timeOffset = 0;

        const audioData = { volume: 0, bass: 0, treble: 0, highFreq: 0 };
        const smoothedData = { volume: 0, bass: 0, treble: 0, highFreq: 0 };
        const smoothingFactor = 0.3; // Very responsive for snappy beats

        const fullscreenIcon = document.getElementById('fullscreen-icon');
        const maximizePath = "M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3";
        const minimizePath = "M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3";

        // Settings Menu Logic
        const settingsBtn = document.getElementById('settings-btn');
        const settingsMenu = document.getElementById('settings-menu');
        
        settingsBtn.addEventListener('click', () => {
            const isVisible = settingsMenu.style.display === 'flex';
            settingsMenu.style.display = isVisible ? 'none' : 'flex';
        });

        // Hide settings when clicking outside
        document.addEventListener('click', (e) => {
            if (!settingsBtn.contains(e.target) && !settingsMenu.contains(e.target)) {
                settingsMenu.style.display = 'none';
            }
        });

        const palettes = {
            'cyber-glow-obsidian': { bottom: new THREE.Color(0x090D16), mid: new THREE.Color(0x00F2FE), top: new THREE.Color(0xF59E0B) },
            'matrix-monolith': { bottom: new THREE.Color(0x022C22), mid: new THREE.Color(0x059669), top: new THREE.Color(0x34D399) },
            'midnight-supernova': { bottom: new THREE.Color(0x1F0A14), mid: new THREE.Color(0xE11D48), top: new THREE.Color(0x8B5CF6) },
            'crimson-horizon': { bottom: new THREE.Color(0x14080A), mid: new THREE.Color(0xDC2626), top: new THREE.Color(0xFB7185) },
            'cybernetic-amber': { bottom: new THREE.Color(0x0A0A0A), mid: new THREE.Color(0xD97706), top: new THREE.Color(0xFDE047) },
            'neon-glacier': { bottom: new THREE.Color(0x030712), mid: new THREE.Color(0x0EA5E9), top: new THREE.Color(0x7DD3FC) },
            'toxic-ultraviolet': { bottom: new THREE.Color(0x120822), mid: new THREE.Color(0x8B5CF6), top: new THREE.Color(0xBEF264) },
            'molten-copper': { bottom: new THREE.Color(0x1C1410), mid: new THREE.Color(0xC2410C), top: new THREE.Color(0xFB923C) },
            'cyberpunk-cobalt': { bottom: new THREE.Color(0x090D1A), mid: new THREE.Color(0x2563EB), top: new THREE.Color(0x38BDF8) },
            'solar-eclipse': { bottom: new THREE.Color(0x121212), mid: new THREE.Color(0xEA580C), top: new THREE.Color(0xFACC15) },
            'acid-venom': { bottom: new THREE.Color(0x051C14), mid: new THREE.Color(0x16A34A), top: new THREE.Color(0x84CC16) },
            'royal-amethyst': { bottom: new THREE.Color(0x1A0B2E), mid: new THREE.Color(0x7C3AED), top: new THREE.Color(0xE879F9) }
        };

        const paletteSelect = document.getElementById('color-palette-select');
        let isAutoCycleEnabled = false;

        let userCustomColors = ['#00f2fe', '#f59e0b'];

        function applyCustomColors() {
            if (!orb || !orb.material) return;
            
            const count = userCustomColors.length;
            const colors = userCustomColors.map(c => new THREE.Color(c));
            
            let cBottom, cMid, cTop;
            
            if (count === 1) {
                cBottom = colors[0]; cMid = colors[0]; cTop = colors[0];
            } else if (count === 2) {
                cBottom = colors[0];
                cMid = colors[0].clone().lerp(colors[1], 0.5);
                cTop = colors[1];
            } else if (count === 3) {
                cBottom = colors[0]; cMid = colors[1]; cTop = colors[2];
            } else if (count === 4) {
                cBottom = colors[0];
                cMid = colors[1].clone().lerp(colors[2], 0.5);
                cTop = colors[3];
            } else if (count >= 5) {
                cBottom = colors[0]; cMid = colors[2]; cTop = colors[4];
            }
            
            orb.material.uniforms.uColorBottom.value.copy(cBottom);
            orb.material.uniforms.uColorMid.value.copy(cMid);
            orb.material.uniforms.uColorTop.value.copy(cTop);
        }

        function renderCustomColorUI() {
            const container = document.getElementById('custom-colors-container');
            container.innerHTML = '';
            
            userCustomColors.forEach((color, index) => {
                const row = document.createElement('div');
                row.className = 'color-row';
                
                const input = document.createElement('input');
                input.type = 'color';
                input.className = 'color-picker';
                input.value = color;
                input.addEventListener('input', (e) => {
                    userCustomColors[index] = e.target.value;
                    if (paletteSelect.value === 'custom') applyCustomColors();
                });
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-color-btn';
                removeBtn.innerHTML = '×';
                removeBtn.disabled = userCustomColors.length <= 1;
                removeBtn.addEventListener('click', () => {
                    if (userCustomColors.length > 1) {
                        userCustomColors.splice(index, 1);
                        renderCustomColorUI();
                        if (paletteSelect.value === 'custom') applyCustomColors();
                    }
                });
                
                row.appendChild(input);
                row.appendChild(removeBtn);
                container.appendChild(row);
            });
            
            document.getElementById('add-color-btn').disabled = userCustomColors.length >= 5;
        }

        document.getElementById('add-color-btn').addEventListener('click', () => {
            if (userCustomColors.length < 5) {
                userCustomColors.push('#ffffff');
                renderCustomColorUI();
                if (paletteSelect.value === 'custom') applyCustomColors();
            }
        });

        renderCustomColorUI();

        paletteSelect.addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                document.getElementById('custom-color-builder').style.display = 'flex';
                if (!isAutoCycleEnabled) applyCustomColors();
            } else {
                document.getElementById('custom-color-builder').style.display = 'none';
                if (!isAutoCycleEnabled) {
                    const selectedPalette = palettes[e.target.value];
                    if (orb && orb.material) {
                        orb.material.uniforms.uColorBottom.value.copy(selectedPalette.bottom);
                        orb.material.uniforms.uColorMid.value.copy(selectedPalette.mid);
                        orb.material.uniforms.uColorTop.value.copy(selectedPalette.top);
                    }
                }
            }
        });

        const autoCycleToggle = document.getElementById('auto-cycle-toggle');
        const speedSlider = document.getElementById('cycle-speed-slider');
        const speedDisplay = document.getElementById('speed-display');
        let cycleSpeedMultiplier = 1.0;
        let currentCycleTime = 0;

        const sizeSlider = document.getElementById('size-slider');
        const sizeDisplay = document.getElementById('size-display');
        let particleSizeMultiplier = 1.0;

        const reactivitySlider = document.getElementById('reactivity-slider');
        const reactivityDisplay = document.getElementById('reactivity-display');
        let audioReactivityMultiplier = 1.0;

        const glowSlider = document.getElementById('glow-slider');
        const glowDisplay = document.getElementById('glow-display');
        let particleGlowMultiplier = 1.0;

        const rotationSlider = document.getElementById('rotation-slider');
        const rotationDisplay = document.getElementById('rotation-display');
        let rotationSpeedMultiplier = 1.0;

        const animSpeedSlider = document.getElementById('anim-speed-slider');
        const animSpeedDisplay = document.getElementById('anim-speed-display');
        let animationSpeedMultiplier = 1.0;

        const chaosSlider = document.getElementById('chaos-slider');
        const chaosDisplay = document.getElementById('chaos-display');
        let chaosJumpMultiplier = 1.0;

        const densitySlider = document.getElementById('density-slider');
        const densityDisplay = document.getElementById('density-display');
        let particleDensity = 1.0;

        speedSlider.addEventListener('input', (e) => {
            cycleSpeedMultiplier = parseFloat(e.target.value);
            speedDisplay.innerText = cycleSpeedMultiplier.toFixed(1) + 'x';
        });

        sizeSlider.addEventListener('input', (e) => {
            particleSizeMultiplier = parseFloat(e.target.value);
            sizeDisplay.innerText = particleSizeMultiplier.toFixed(1) + 'x';
            if (orb && orb.material) {
                orb.material.uniforms.uParticleSize.value = particleSizeMultiplier;
            }
        });

        reactivitySlider.addEventListener('input', (e) => {
            audioReactivityMultiplier = parseFloat(e.target.value);
            reactivityDisplay.innerText = audioReactivityMultiplier.toFixed(1) + 'x';
        });

        glowSlider.addEventListener('input', (e) => {
            particleGlowMultiplier = parseFloat(e.target.value);
            glowDisplay.innerText = particleGlowMultiplier.toFixed(1) + 'x';
            if (orb && orb.material) {
                orb.material.uniforms.uGlow.value = particleGlowMultiplier;
            }
        });

        rotationSlider.addEventListener('input', (e) => {
            rotationSpeedMultiplier = parseFloat(e.target.value);
            rotationDisplay.innerText = rotationSpeedMultiplier.toFixed(1) + 'x';
        });

        animSpeedSlider.addEventListener('input', (e) => {
            animationSpeedMultiplier = parseFloat(e.target.value);
            animSpeedDisplay.innerText = animationSpeedMultiplier.toFixed(1) + 'x';
            if (orb && orb.material) {
                orb.material.uniforms.uAnimSpeed.value = animationSpeedMultiplier;
            }
        });

        chaosSlider.addEventListener('input', (e) => {
            chaosJumpMultiplier = parseFloat(e.target.value);
            chaosDisplay.innerText = chaosJumpMultiplier.toFixed(1) + 'x';
            if (orb && orb.material) {
                orb.material.uniforms.uChaosMult.value = chaosJumpMultiplier;
            }
        });

        densitySlider.addEventListener('input', (e) => {
            particleDensity = parseInt(e.target.value) / 100.0;
            densityDisplay.innerText = e.target.value + '%';
            if (orb && orb.geometry) {
                orb.geometry.setDrawRange(0, Math.floor(particleCount * particleDensity));
            }
        });

        autoCycleToggle.addEventListener('change', (e) => {
            isAutoCycleEnabled = e.target.checked;
            paletteSelect.disabled = isAutoCycleEnabled;
            
            if (isAutoCycleEnabled) {
                document.getElementById('custom-color-builder').style.display = 'none';
            } else {
                if (paletteSelect.value === 'custom') {
                    document.getElementById('custom-color-builder').style.display = 'flex';
                    applyCustomColors();
                } else {
                    const selectedPalette = palettes[paletteSelect.value];
                    if (orb && orb.material) {
                        orb.material.uniforms.uColorBottom.value.copy(selectedPalette.bottom);
                        orb.material.uniforms.uColorMid.value.copy(selectedPalette.mid);
                        orb.material.uniforms.uColorTop.value.copy(selectedPalette.top);
                    }
                }
            }
        });

        fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.warn(`Error attempting to enable fullscreen: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        });

        document.addEventListener('fullscreenchange', () => {
            if (document.fullscreenElement) {
                fullscreenIcon.innerHTML = `<path d="${minimizePath}"></path>`;
            } else {
                fullscreenIcon.innerHTML = `<path d="${maximizePath}"></path>`;
            }
        });

        const container = document.getElementById('canvas-container');
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);
        
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 160;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        const particleCount = 65000;
        const baseGeometry = new THREE.SphereGeometry(45, 240, 240); 
        
        const positions = new Float32Array(particleCount * 3);
        const randoms = new Float32Array(particleCount);
        const normals = new Float32Array(particleCount * 3);

        const posAttribute = baseGeometry.attributes.position;
        for(let i = 0; i < particleCount; i++) {
            const vertexIndex = Math.floor(Math.random() * posAttribute.count);
            const x = posAttribute.getX(vertexIndex);
            const y = posAttribute.getY(vertexIndex);
            const z = posAttribute.getZ(vertexIndex);

            positions[i*3] = x;
            positions[i*3+1] = y;
            positions[i*3+2] = z;

            normals[i*3] = x / 45.0;
            normals[i*3+1] = y / 45.0;
            normals[i*3+2] = z / 45.0;

            randoms[i] = Math.random();
        }

        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        particleGeometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

        const particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uVolume: { value: 0 },
                uBass: { value: 0 },
                uTreble: { value: 0 },
                uChaos: { value: 0 },
                uTime: { value: 0 },
                uParticleSize: { value: 1.0 },
                uGlow: { value: 1.0 },
                uAnimSpeed: { value: 1.0 },
                uChaosMult: { value: 1.0 },
                uColorBottom: { value: palettes['cyber-glow-obsidian'].bottom.clone() },
                uColorMid: { value: palettes['cyber-glow-obsidian'].mid.clone() },
                uColorTop: { value: palettes['cyber-glow-obsidian'].top.clone() }
            },
            vertexShader: `
                uniform float uVolume;
                uniform float uBass;
                uniform float uTreble;
                uniform float uChaos;
                uniform float uTime;
                uniform float uParticleSize;
                uniform float uAnimSpeed;
                uniform float uChaosMult;

                attribute float aRandom;
                
                varying vec3 vPosition;
                varying float vNoise;
                varying float vYNorm;

                float hash(float n) { return fract(sin(n) * 43758.5453123); }
                float noise(vec3 x) {
                    vec3 p = floor(x);
                    vec3 f = fract(x);
                    f = f * f * (3.0 - 2.0 * f);
                    float n = p.x + p.y * 57.0 + 113.0 * p.z;
                    return mix(mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
                                   mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y),
                               mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
                                   mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y), f.z);
                }

                void main() {
                    vPosition = position;
                    vYNorm = position.y / 45.0; // -1 to 1

                    vec3 displacedPosition = position;
                    float distFromPole = abs(vYNorm); 
                    
                    // Add smooth slow idle movement (breathing)
                    float baseNoise = noise(position * 0.04 + vec3(uTime * 0.3 * uAnimSpeed));
                    float baseJump = (baseNoise - 0.5) * 6.0;
                    
                    // Audio reactive displacement
                    float audioNoise = noise(position * 0.08 + vec3(uBass * 5.0 - (uTime * 0.5 * uAnimSpeed)));
                    float audioJump = (audioNoise - 0.5) * (uBass * 35.0 + uChaos * 20.0) * uChaosMult;
                    
                    // Combine them, amplifying audio with poles
                    float poleAmplifier = 0.5 + (distFromPole * 2.0);
                    float totalJump = baseJump + (audioJump * poleAmplifier);
                    
                    displacedPosition += normal * totalJump;
                    
                    // Overall rhythmic pulse scaling
                    float pulse = 1.0 + (uVolume * 0.35 * (0.7 + aRandom * 0.6));
                    displacedPosition *= pulse;
                    
                    vNoise = audioJump + baseJump * 0.5;

                    vec4 mvPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
                    gl_PointSize = (1.2 + aRandom * 1.8) * uParticleSize * (170.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform float uVolume;
                uniform float uBass;
                uniform float uTreble;
                uniform float uGlow;
                uniform vec3 uColorBottom;
                uniform vec3 uColorMid;
                uniform vec3 uColorTop;

                varying vec3 vPosition;
                varying float vNoise;
                varying float vYNorm;

                void main() {
                    vec2 xy = gl_PointCoord.xy - vec2(0.5);
                    float ll = length(xy);
                    if (ll > 0.5) discard;
                    
                    float alpha = (0.5 - ll) * 2.0;
                    float normalizedY = (vYNorm + 1.0) * 0.5; // 0 at bottom, 1 at top
                    
                    vec3 color = uColorMid;
                    if (normalizedY > 0.5) {
                        float t = (normalizedY - 0.5) * 2.0;
                        t = pow(t, 0.7);
                        color = mix(uColorMid, uColorTop, t);
                    } else {
                        float t = (0.5 - normalizedY) * 2.0;
                        t = pow(t, 0.7);
                        color = mix(uColorMid, uColorBottom, t);
                    }

                    // Keep original color without adding white glow
                    vec3 finalColor = color;

                    // Increased alpha overall to make the orb more solid and less "sparse"
                    float baseAlpha = 0.75 + (abs(vYNorm) * 0.25);
                    float finalAlpha = alpha * (baseAlpha + (uVolume * 0.5)) * uGlow;
                    
                    // Multiply color by uGlow for additive brightness punch
                    finalColor *= uGlow;
                    
                    finalAlpha = clamp(finalAlpha, 0.0, 1.0);

                    gl_FragColor = vec4(finalColor, finalAlpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const orb = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(orb);

        let targetRotationX = 0;
        let targetRotationY = 0;
        let mouseX = 0;
        let mouseY = 0;
        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;

        document.addEventListener('mousemove', (event) => {
            mouseX = (event.clientX - windowHalfX) * 0.0006;
            mouseY = (event.clientY - windowHalfY) * 0.0006;
        });

        document.addEventListener('touchmove', (event) => {
            if (event.touches.length > 0) {
                mouseX = (event.touches[0].clientX - windowHalfX) * 0.0006;
                mouseY = (event.touches[0].clientY - windowHalfY) * 0.0006;
            }
        }, { passive: true });

        class AudioAnalyzer {
            constructor(audioContext, fftSize = 512) {
                this.audioContext = audioContext;
                this.analyser = audioContext.createAnalyser();
                this.analyser.fftSize = fftSize;
                this.analyser.smoothingTimeConstant = 0.3;

                this.bufferLength = this.analyser.frequencyBinCount; // 256
                this.timeData = new Float32Array(this.analyser.fftSize); // 512
                this.freqData = new Uint8Array(this.bufferLength); // 256

                // Adaptive noise floor tracking
                this.noiseFloor = 0.003;
                this.decayRate = 0.0001;

                this.updateFrequencyBoundaries();
            }

            updateFrequencyBoundaries() {
                const sampleRate = this.audioContext ? this.audioContext.sampleRate : 44100;
                const binNyquist = sampleRate / 2;
                const hzPerBin = binNyquist / this.bufferLength;

                // Bass: ~20 Hz to 250 Hz
                this.bassStartBin = Math.max(0, Math.floor(20 / hzPerBin));
                this.bassEndBin = Math.max(this.bassStartBin + 1, Math.floor(250 / hzPerBin));

                // Mid: ~250 Hz to 4000 Hz
                this.midEndBin = Math.max(this.bassEndBin + 1, Math.floor(4000 / hzPerBin));

                // Treble: ~4000 Hz to 16000 Hz
                this.trebleEndBin = Math.min(this.bufferLength, Math.floor(16000 / hzPerBin));
            }

            analyze(reactivityMultiplier = 1.0) {
                if (!this.analyser) {
                    return { volume: 0, bass: 0, treble: 0, highFreq: 0 };
                }

                // 1. Time-Domain PCM for Volume (RMS & Peak Energy)
                this.analyser.getFloatTimeDomainData(this.timeData);

                let sumSquares = 0;
                let peakSample = 0;
                for (let i = 0; i < this.timeData.length; i++) {
                    const sample = this.timeData[i];
                    const abs = Math.abs(sample);
                    if (abs > peakSample) peakSample = abs;
                    sumSquares += sample * sample;
                }

                const rms = Math.sqrt(sumSquares / this.timeData.length);
                
                // Combine RMS (60%) and Peak (40%) for immediate response to claps/speech
                let rawAmplitude = (rms * 0.6) + (peakSample * 0.4);

                // Adaptive Noise Floor: track quiet background hum
                if (rawAmplitude < this.noiseFloor) {
                    this.noiseFloor = this.noiseFloor * 0.95 + rawAmplitude * 0.05;
                } else {
                    this.noiseFloor = Math.max(0.001, this.noiseFloor - this.decayRate);
                }

                // Subtract noise floor
                let signal = Math.max(0, rawAmplitude - this.noiseFloor);

                // Controlled gain curve: maps speech & environmental sounds to 0.15-0.5, loud sounds to 0.8-1.0
                const gainScale = 12.0; 
                let volume = Math.min(1.0, Math.pow(signal * gainScale, 0.75)) * reactivityMultiplier;

                if (signal <= 0.0005) {
                    volume = 0;
                }

                // 2. Frequency-Domain Analysis for Bass / Mid / Treble / High (Chaos)
                this.analyser.getByteFrequencyData(this.freqData);

                let bassSum = 0, bassCount = 0;
                for (let i = this.bassStartBin; i < this.bassEndBin; i++) {
                    bassSum += this.freqData[i];
                    bassCount++;
                }

                let midSum = 0, midCount = 0;
                for (let i = this.bassEndBin; i < this.midEndBin; i++) {
                    midSum += this.freqData[i];
                    midCount++;
                }

                let trebleSum = 0, trebleCount = 0;
                for (let i = this.midEndBin; i < this.trebleEndBin; i++) {
                    trebleSum += this.freqData[i];
                    trebleCount++;
                }

                let highSum = 0, highCount = 0;
                for (let i = this.trebleEndBin; i < this.bufferLength; i++) {
                    highSum += this.freqData[i];
                    highCount++;
                }

                const bassVal = (bassCount > 0 ? (bassSum / bassCount) / 255 : 0) * reactivityMultiplier;
                const midVal = (midCount > 0 ? (midSum / midCount) / 255 : 0) * reactivityMultiplier;
                const trebleVal = (trebleCount > 0 ? (trebleSum / trebleCount) / 255 : 0) * reactivityMultiplier;
                const highVal = (highCount > 0 ? (highSum / highCount) / 255 : 0) * reactivityMultiplier;

                const volumeWeight = volume > 0 ? Math.min(1.0, volume * 1.5) : 0;
                const bass = bassVal * volumeWeight;
                const treble = trebleVal * volumeWeight;
                const highFreq = highVal * volumeWeight;

                return { volume, bass, treble, highFreq, rms, peak: peakSample, rawAmplitude, noiseFloor: this.noiseFloor };
            }
        }

        class AudioSourceManager {
            constructor() {
                this.audioContext = null;
                this.analyzer = null;
                this.currentStream = null;
                this.currentSourceNode = null;
                this.linuxAudioProcess = null;
                this.linuxScriptNode = null;
                this.activeMode = null; // 'inner' or 'outer'
                this.isSyncActive = false;
            }

            async ensureAudioContext() {
                if (!this.audioContext) {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    this.analyzer = new AudioAnalyzer(this.audioContext, 512);
                }
                if (this.audioContext.state === 'suspended') {
                    await this.audioContext.resume();
                }
            }

            async startSync(mode) {
                await this.ensureAudioContext();

                // Stop any existing stream cleanly before starting new mode
                this.stopStreamOnly();

                this.activeMode = mode;
                let success = false;

                if (mode === 'inner') {
                    success = await this.startInnerAudio();
                } else {
                    success = await this.startOuterAudio();
                }

                if (success) {
                    this.isSyncActive = true;
                    return true;
                } else {
                    this.stopSync();
                    return false;
                }
            }

            async startOuterAudio() {
                try {
                    console.log("[OuterAudio] Starting microphone capture via getUserMedia...");
                    this.currentStream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            echoCancellation: false,
                            noiseSuppression: false,
                            autoGainControl: false
                        }
                    });
                    this.currentSourceNode = this.audioContext.createMediaStreamSource(this.currentStream);
                    this.currentSourceNode.connect(this.analyzer.analyser);
                    console.log("[OuterAudio] Microphone stream connected to AudioAnalyzer.");

                    if (this.currentStream.getTracks().length > 0) {
                        this.currentStream.getTracks()[0].onended = () => {
                            if (this.activeMode === 'outer') this.stopSync();
                        };
                    }
                    return true;
                } catch (err) {
                    console.error("[OuterAudio] Microphone capture failed:", err);
                    alert("Microphone access denied or unavailable.");
                    return false;
                }
            }

            async startInnerAudio() {
                const isLinux = navigator.userAgent.toLowerCase().includes('linux');

                if (isLinux) {
                    console.log("[InnerAudio] Resolving Linux PipeWire output sink target...");
                    let sinkTarget = null;

                    // 1. Try resolving default sink ID via wpctl status
                    try {
                        const { execSync } = require('child_process');
                        const wpOut = execSync('wpctl status', { encoding: 'utf8', timeout: 1000 });
                        const sinksSection = wpOut.match(/Sinks:\s*\n((?:\s+.*\n)+)/);
                        if (sinksSection) {
                            for (const line of sinksSection[1].split('\n')) {
                                if (line.includes('*')) {
                                    const m = line.match(/(\d+)\./);
                                    if (m) {
                                        sinkTarget = m[1];
                                        break;
                                    }
                                }
                            }
                        }
                    } catch (e) {}

                    // 2. Fallback: try resolving Audio/Sink node name via pw-cli
                    if (!sinkTarget) {
                        try {
                            const { execSync } = require('child_process');
                            const pwOut = execSync('pw-cli list-objects Node', { encoding: 'utf8', timeout: 1000 });
                            const nodes = pwOut.split('id ');
                            for (const n of nodes) {
                                if (n.includes('media.class = "Audio/Sink"')) {
                                    const m = n.match(/node\.name = "([^"]+)"/);
                                    if (m) {
                                        sinkTarget = m[1];
                                        break;
                                    }
                                }
                            }
                        } catch (e) {}
                    }

                    if (!sinkTarget) {
                        console.error("[InnerAudio] Could not resolve PipeWire output sink target.");
                        alert("System audio capture unavailable: Could not locate system output sink.");
                        return false;
                    }

                    console.log(`[InnerAudio] Backend: PipeWire (pw-record) | Target Node: ${sinkTarget} | SampleRate: ${this.audioContext.sampleRate}`);

                    try {
                        const { spawn } = require('child_process');
                        const monitorProcess = spawn('pw-record', [
                            '--format=f32',
                            '--rate=' + this.audioContext.sampleRate,
                            '--channels=1',
                            '-P', '{"stream.capture.sink": true}',
                            '--target', sinkTarget,
                            '-'
                        ]);

                        const bufferSize = 4096;
                        const scriptNode = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
                        let audioQueue = new Float32Array(0);

                        monitorProcess.stdout.on('data', (chunk) => {
                            const floats = new Float32Array(chunk.buffer, chunk.byteOffset, chunk.length / 4);
                            const newQueue = new Float32Array(audioQueue.length + floats.length);
                            newQueue.set(audioQueue);
                            newQueue.set(floats, audioQueue.length);
                            audioQueue = newQueue;
                        });

                        monitorProcess.on('error', (err) => {
                            console.error("[InnerAudio] pw-record process error:", err);
                        });

                        scriptNode.onaudioprocess = (audioProcessingEvent) => {
                            const outputData = audioProcessingEvent.outputBuffer.getChannelData(0);
                            if (audioQueue.length >= bufferSize) {
                                outputData.set(audioQueue.subarray(0, bufferSize));
                                audioQueue = audioQueue.subarray(bufferSize);
                            } else {
                                outputData.set(audioQueue);
                                outputData.fill(0, audioQueue.length);
                                audioQueue = new Float32Array(0);
                            }
                        };

                        scriptNode.connect(this.analyzer.analyser);
                        this.linuxAudioProcess = monitorProcess;
                        this.linuxScriptNode = scriptNode;
                        console.log("[InnerAudio] PipeWire output monitor stream connected strictly to AudioAnalyzer.");
                        return true;
                    } catch (e) {
                        console.error("[InnerAudio] PipeWire capture failed:", e);
                        alert("System audio capture is unavailable on Linux.");
                        return false;
                    }
                } else {
                    // Windows / macOS System Audio Capture
                    console.log("[InnerAudio] Windows/macOS System Audio Capture starting...");
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const monitorDevice = devices.find(d => d.kind === 'audioinput' && 
                        (d.label.toLowerCase().includes('stereo mix') || d.label.toLowerCase().includes('loopback') || d.label.toLowerCase().includes('what u hear')));

                    if (monitorDevice) {
                        try {
                            console.log(`[InnerAudio] Selected hardware loopback device: ${monitorDevice.label}`);
                            this.currentStream = await navigator.mediaDevices.getUserMedia({
                                audio: { deviceId: { exact: monitorDevice.deviceId } }
                            });
                            this.currentSourceNode = this.audioContext.createMediaStreamSource(this.currentStream);
                            this.currentSourceNode.connect(this.analyzer.analyser);
                            return true;
                        } catch (e) {}
                    }

                    // Display Media Loopback fallback
                    try {
                        console.log("[InnerAudio] Requesting display media loopback audio...");
                        this.currentStream = await navigator.mediaDevices.getDisplayMedia({
                            video: true,
                            audio: true
                        });

                        const audioTracks = this.currentStream.getAudioTracks();
                        if (audioTracks.length === 0) {
                            alert("Selected display stream contains no audio track. Inner Audio Sync requires system audio.");
                            this.stopStreamOnly();
                            return false;
                        }

                        // Stop video tracks to conserve resources
                        this.currentStream.getVideoTracks().forEach(track => track.stop());

                        this.currentSourceNode = this.audioContext.createMediaStreamSource(this.currentStream);
                        this.currentSourceNode.connect(this.analyzer.analyser);

                        audioTracks[0].onended = () => {
                            if (this.activeMode === 'inner') this.stopSync();
                        };
                        return true;
                    } catch (e) {
                        console.warn("[InnerAudio] Display media capture cancelled/failed:", e);
                        alert("System audio capture is unavailable or was cancelled.");
                        return false;
                    }
                }
            }

            async switchMode(newMode) {
                if (!this.isSyncActive) return;
                if (this.activeMode === newMode) return;
                console.log(`[AudioManager] Live switching mode: ${this.activeMode} -> ${newMode}`);
                await this.startSync(newMode);
            }

            stopStreamOnly() {
                console.log("[AudioManager] Destroying active audio stream / subprocess...");
                if (this.currentStream && this.currentStream.getTracks) {
                    this.currentStream.getTracks().forEach(track => track.stop());
                    this.currentStream = null;
                }
                if (this.currentSourceNode) {
                    try { this.currentSourceNode.disconnect(); } catch (e) {}
                    this.currentSourceNode = null;
                }
                if (this.linuxAudioProcess) {
                    try { this.linuxAudioProcess.kill('SIGTERM'); } catch (e) {}
                    this.linuxAudioProcess = null;
                }
                if (this.linuxScriptNode) {
                    try { this.linuxScriptNode.disconnect(); } catch (e) {}
                    this.linuxScriptNode = null;
                }
            }

            stopSync() {
                this.stopStreamOnly();
                this.isSyncActive = false;
                this.activeMode = null;
                if (this.audioContext && this.audioContext.state === 'running') {
                    this.audioContext.suspend();
                }
            }
        }

        const audioManager = new AudioSourceManager();
        const innerAudioToggle = document.getElementById('inner-audio-toggle');

        innerAudioToggle.addEventListener('change', async () => {
            if (audioManager.isSyncActive) {
                const desiredMode = innerAudioToggle.checked ? 'inner' : 'outer';
                await audioManager.switchMode(desiredMode);
            }
        });

        syncBtn.addEventListener('click', async () => {
            if (audioManager.isSyncActive) {
                audioManager.stopSync();
                syncBtn.classList.remove('active-btn');
                syncBtnText.innerText = 'Start Sync';
            } else {
                const desiredMode = innerAudioToggle.checked ? 'inner' : 'outer';
                const success = await audioManager.startSync(desiredMode);
                if (success) {
                    syncBtn.classList.add('active-btn');
                    syncBtnText.innerText = 'Stop Sync';
                } else {
                    syncBtn.classList.remove('active-btn');
                    syncBtnText.innerText = 'Start Sync';
                }
            }
        });

        let frameCounter = 0;
        function updateAudioData() {
            if (!audioManager || !audioManager.isSyncActive || !audioManager.analyzer) {
                audioData.volume = 0;
                audioData.bass = 0;
                audioData.treble = 0;
                audioData.highFreq = 0;
                return;
            }

            const metrics = audioManager.analyzer.analyze(audioReactivityMultiplier);
            audioData.volume = metrics.volume;
            audioData.bass = metrics.bass;
            audioData.treble = metrics.treble;
            audioData.highFreq = metrics.highFreq;

            frameCounter++;
            if (frameCounter % 30 === 0) {
                const pid = audioManager.linuxAudioProcess ? audioManager.linuxAudioProcess.pid : 'N/A';
                console.log(`[DIAGNOSTIC FRAME] mode: ${audioManager.activeMode} | PID: ${pid} | RMS: ${metrics.rms.toFixed(6)} | Peak: ${metrics.peak.toFixed(6)} | Vol: ${metrics.volume.toFixed(4)} | Bass: ${metrics.bass.toFixed(4)} | Treble: ${metrics.treble.toFixed(4)} | High: ${metrics.highFreq.toFixed(4)}`);
            }
        }

        function animate() {
            requestAnimationFrame(animate);

            updateAudioData();

            smoothedData.volume += (audioData.volume - smoothedData.volume) * smoothingFactor;
            smoothedData.bass += (audioData.bass - smoothedData.bass) * smoothingFactor;
            smoothedData.treble += (audioData.treble - smoothedData.treble) * smoothingFactor;
            smoothedData.highFreq += (audioData.highFreq - smoothedData.highFreq) * smoothingFactor;

            timeOffset += 0.015;

            if (orb && orb.material) {
                orb.material.uniforms.uVolume.value = smoothedData.volume;
                orb.material.uniforms.uBass.value = smoothedData.bass;
                orb.material.uniforms.uTreble.value = smoothedData.treble;
                orb.material.uniforms.uChaos.value = smoothedData.highFreq;
                orb.material.uniforms.uTime.value = timeOffset;
                
                if (isAutoCycleEnabled) {
                    const paletteKeys = Object.keys(palettes);
                    const speed = 0.2 * cycleSpeedMultiplier; // roughly 5 seconds per theme at 1x
                    currentCycleTime += 0.015 * speed;
                    
                    const currentIndex = Math.floor(currentCycleTime) % paletteKeys.length;
                    const nextIndex = (currentIndex + 1) % paletteKeys.length;
                    const lerpFactor = currentCycleTime - Math.floor(currentCycleTime);
                    
                    const currentPal = palettes[paletteKeys[currentIndex]];
                    const nextPal = palettes[paletteKeys[nextIndex]];

                    orb.material.uniforms.uColorBottom.value.copy(currentPal.bottom).lerp(nextPal.bottom, lerpFactor);
                    orb.material.uniforms.uColorMid.value.copy(currentPal.mid).lerp(nextPal.mid, lerpFactor);
                    orb.material.uniforms.uColorTop.value.copy(currentPal.top).lerp(nextPal.top, lerpFactor);
                    
                    // Sync the UI select so it reflects the current theme transitioning in
                    if (paletteSelect.value !== paletteKeys[currentIndex]) {
                        paletteSelect.value = paletteKeys[currentIndex];
                    }
                }
            }

            targetRotationY = mouseX * 0.4;
            targetRotationX = mouseY * 0.4;
            
            orb.rotation.y += (targetRotationY - orb.rotation.y) * 0.05;
            orb.rotation.x += (targetRotationX - orb.rotation.x) * 0.05;
            
            orb.rotation.y += 0.0025 * rotationSpeedMultiplier;

            renderer.render(scene, camera);
        }

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        window.onload = function() {
            animate();
        };
