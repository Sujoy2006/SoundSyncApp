import re

with open('script.js', 'r') as f:
    code = f.read()

# 1. Update buildGeometry
code = re.sub(
    r'function buildGeometry\(type\).*?const waveGeometry = buildGeometry\(\'wave\'\);',
    r'''function buildOrbGeometry() {
            const positions = new Float32Array(particleCount * 3);
            const randoms = new Float32Array(particleCount);
            const normals = new Float32Array(particleCount * 3);
            
            const baseGeom = new THREE.SphereGeometry(45, 240, 240);
            const posAttr = baseGeom.attributes.position;
            for(let i = 0; i < particleCount; i++) {
                const idx = Math.floor(Math.random() * posAttr.count);
                const x = posAttr.getX(idx);
                const y = posAttr.getY(idx);
                const z = posAttr.getZ(idx);
                positions[i*3] = x; positions[i*3+1] = y; positions[i*3+2] = z;
                normals[i*3] = x/45.0; normals[i*3+1] = y/45.0; normals[i*3+2] = z/45.0;
                randoms[i] = Math.random();
            }
            
            const geom = new THREE.BufferGeometry();
            geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geom.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
            geom.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));
            return geom;
        }

        const orbGeometry = buildOrbGeometry();''',
    code, flags=re.DOTALL
)

# 2. Update density slider
code = re.sub(
    r'orbGeometry\.setDrawRange\(0, drawCount\);\s*waveGeometry\.setDrawRange\(0, drawCount\);',
    r'''orbGeometry.setDrawRange(0, drawCount);
            if (typeof waveGroup !== 'undefined' && waveGroup.children) {
                const activeRibbons = Math.max(1, Math.floor(waveGroup.children.length * particleDensity));
                waveGroup.children.forEach((mesh, index) => {
                    mesh.visible = index < activeRibbons;
                });
            }''',
    code
)

# 3. Update the shapeSelect listener and mesh setup
# We find:
# const orb = new THREE.Points(orbGeometry, particleMaterial);
# scene.add(orb);
# ... until ...
# });
code = re.sub(
    r'const orb = new THREE\.Points\(orbGeometry, particleMaterial\);.*?shapeSelect\.addEventListener\(\'change\', \(e\) => \{.*?\}\);',
    r'''const orb = new THREE.Points(orbGeometry, particleMaterial);
        scene.add(orb);

        const waveGroup = new THREE.Group();
        const ribbonCount = 7;
        const ribbonMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uVolume: { value: 0 },
                uBass: { value: 0 },
                uTreble: { value: 0 },
                uTime: { value: 0 },
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
                uniform float uTime;
                uniform float uAnimSpeed;
                uniform float uChaosMult;

                attribute float aRibbonIndex;

                varying vec2 vUv;
                varying float vRibbonIndex;
                varying float vIntensity;

                void main() {
                    vUv = uv; 
                    vRibbonIndex = aRibbonIndex;
                    
                    vec3 pos = position;
                    
                    float nx = (pos.x / 140.0);
                    float edgeFade = smoothstep(1.0, 0.4, abs(nx));
                    float phase = aRibbonIndex * 1.7;
                    
                    float t = uTime * 0.4 * uAnimSpeed;
                    float wave1 = sin(nx * 2.5 + t + phase) * 12.0;
                    float wave2 = sin(nx * 4.0 - t * 1.5 + phase * 2.0) * 8.0;
                    
                    float audioWave = sin(nx * 3.5 + t * 2.5 + phase) * (uBass * 25.0 * uChaosMult);
                    float highWave = sin(nx * 10.0 - t * 3.5 + phase) * (uTreble * 15.0 * uChaosMult);
                    
                    float totalDisplacement = (wave1 + wave2 + audioWave + highWave) * edgeFade;
                    pos.y += totalDisplacement;
                    
                    pos.z += aRibbonIndex * 3.0 - 9.0;
                    
                    vIntensity = abs(totalDisplacement) / 30.0;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 uColorBottom;
                uniform vec3 uColorMid;
                uniform vec3 uColorTop;
                uniform float uGlow;
                uniform float uVolume;

                varying vec2 vUv;
                varying float vRibbonIndex;
                varying float vIntensity;

                void main() {
                    vec3 color;
                    if (vUv.x < 0.5) {
                        float t = vUv.x * 2.0;
                        color = mix(uColorBottom, uColorMid, t);
                    } else {
                        float t = (vUv.x - 0.5) * 2.0;
                        color = mix(uColorMid, uColorTop, t);
                    }
                    
                    float m = mod(vRibbonIndex, 3.0);
                    if (m == 0.0) color = mix(color, uColorTop, 0.6);
                    if (m == 1.0) color = mix(color, uColorBottom, 0.6);

                    float yFade = sin(vUv.y * 3.14159);
                    yFade = pow(yFade, 1.5); 
                    
                    float xFade = sin(vUv.x * 3.14159);
                    xFade = pow(xFade, 0.5);
                    
                    float alpha = yFade * xFade * uGlow * (0.4 + uVolume * 0.6);
                    
                    color += color * vIntensity * 0.4;
                    color *= uGlow * 1.8;

                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        for (let i = 0; i < ribbonCount; i++) {
            const geom = new THREE.PlaneGeometry(280, 50, 256, 16);
            const offsets = new Float32Array(geom.attributes.position.count);
            offsets.fill(i);
            geom.setAttribute('aRibbonIndex', new THREE.BufferAttribute(offsets, 1));
            const mesh = new THREE.Mesh(geom, ribbonMaterial);
            waveGroup.add(mesh);
        }
        scene.add(waveGroup);
        waveGroup.visible = false;

        const shapeSelect = document.getElementById('shape-select');
        shapeSelect.addEventListener('change', (e) => {
            currentGeometryType = e.target.value;
            if (currentGeometryType === 'orb') {
                orb.visible = true;
                waveGroup.visible = false;
            } else {
                orb.visible = false;
                waveGroup.visible = true;
                waveGroup.rotation.set(0, 0, 0); 
            }
        });''',
    code, flags=re.DOTALL
)

# 4. Inject ribbonMaterial uniform updates in animate
code = re.sub(
    r'orb\.material\.uniforms\.uTime\.value = timeOffset;',
    r'''orb.material.uniforms.uTime.value = timeOffset;
                
                if (typeof ribbonMaterial !== 'undefined') {
                    ribbonMaterial.uniforms.uVolume.value = smoothedData.volume;
                    ribbonMaterial.uniforms.uBass.value = smoothedData.bass;
                    ribbonMaterial.uniforms.uTreble.value = smoothedData.treble;
                    ribbonMaterial.uniforms.uTime.value = timeOffset;
                }''',
    code
)

# 5. Inject color updates in applyCustomColors
code = re.sub(
    r'orb\.material\.uniforms\.uColorTop\.value\.copy\(cTop\);',
    r'''orb.material.uniforms.uColorTop.value.copy(cTop);
            if (typeof ribbonMaterial !== 'undefined') {
                ribbonMaterial.uniforms.uColorBottom.value.copy(cBottom);
                ribbonMaterial.uniforms.uColorMid.value.copy(cMid);
                ribbonMaterial.uniforms.uColorTop.value.copy(cTop);
            }''',
    code
)

# 6. Inject color updates in paletteSelect listener
code = re.sub(
    r'orb\.material\.uniforms\.uColorTop\.value\.copy\(selectedPalette\.top\);',
    r'''orb.material.uniforms.uColorTop.value.copy(selectedPalette.top);
                    }
                    if (typeof ribbonMaterial !== 'undefined') {
                        ribbonMaterial.uniforms.uColorBottom.value.copy(selectedPalette.bottom);
                        ribbonMaterial.uniforms.uColorMid.value.copy(selectedPalette.mid);
                        ribbonMaterial.uniforms.uColorTop.value.copy(selectedPalette.top);''',
    code
)

# 7. Add slider uniform updates to ribbonMaterial
for uniform, slider in [('uGlow', 'particleGlowMultiplier'), ('uAnimSpeed', 'animationSpeedMultiplier'), ('uChaosMult', 'chaosJumpMultiplier')]:
    code = re.sub(
        rf'orb\.material\.uniforms\.{uniform}\.value = {slider};',
        rf'''orb.material.uniforms.{uniform}.value = {slider};
            }}
            if (typeof ribbonMaterial !== 'undefined') {{
                ribbonMaterial.uniforms.{uniform}.value = {slider};''',
        code
    )

with open('script.js', 'w') as f:
    f.write(code)

