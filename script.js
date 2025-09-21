class Portfolio3D {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.loadingManager = null;
        this.model = null;
        this.clock = new THREE.Clock();
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.intersectableObjects = [];
        this.isTransitioning = false;
        this.interactiveManager = null;
        this.helpersVisible = true;
        this.helpers = []; // Store all helper objects
        
        // Movement controls
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false,
            q: false,
            e: false
        };
        this.moveSpeed = 0.5;
        this.isFirstPerson = true; // Start in first-person mode by default
        
        // Camera positions for different views (using Blender coordinates with increased zoom)
        this.cameraPositions = {
            home: { 
                position: { x: -3.93109, y: -2.85983, z: 4.95835 }, 
                target: { x: 6.5, y: 8, z: 2.5 },
                info: "Welcome to My 3D Portfolio"
            },
            desk: { 
                position: { x: -0.91083, y: 0.18636, z: 3.77508 }, 
                target: { x: -1.84617, y: 14.64703, z: -1 },
                info: "My Workspace - Where the magic happens"
            },
            projects: { 
                position: { x: -0.47403, y: 1.2, z: 3.56846 }, 
                target: { x: -1, y: 15.5, z: -1 },
                info: "My Projects - Creative solutions and innovations"
            },
            about: { 
                position: { x: 0.23754, y: 0.84584, z: 3.79367 }, 
                target: { x: 1, y: 4.5, z: -11 },
                info: "About Me - Passion for 3D and interactive experiences"
            }
        };

        this.currentView = 'home';
        this.init();
    }

    init() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        this.setupControls();
        this.setupEventListeners();
        this.loadModel();
        this.animate();
    }

    setupScene() {
        this.scene = new THREE.Scene();
        
        // Enhanced background with gradient for more realistic look
        this.scene.background = new THREE.Color(0x2c2c2c); // Slightly lighter for better contrast
        
        // Enhanced fog for atmospheric depth (like Cycles volume scattering)
        this.scene.fog = new THREE.FogExp2(0x2c2c2c, 0.015); // Exponential fog for more realistic falloff
        
        // Add axis helper to visualize coordinate system
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);
        this.helpers.push(axesHelper);
        
        // Add grid helpers for better spatial understanding
        // XY Grid (vertical plane at Z=0)
        const gridXY = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
        gridXY.rotation.x = Math.PI / 2; // Rotate to be in XY plane
        gridXY.position.z = 0;
        this.scene.add(gridXY);
        this.helpers.push(gridXY);
        
        // XZ Grid (horizontal plane at Y=0) - Main floor grid
        const gridXZ = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
        gridXZ.position.y = 0;
        this.scene.add(gridXZ);
        this.helpers.push(gridXZ);
        
        // YZ Grid (vertical plane at X=0)
        const gridYZ = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
        gridYZ.rotation.z = Math.PI / 2; // Rotate to be in YZ plane
        gridYZ.position.x = 0;
        this.scene.add(gridYZ);
        this.helpers.push(gridYZ);
        
        // Add axis labels using text sprites
        this.addAxisLabels();
    }

    addAxisLabels() {
        // Create text labels for axes
        const createTextSprite = (text, color, position) => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 128;
            canvas.height = 64;
            
            context.fillStyle = color;
            context.font = 'Bold 32px Arial';
            context.textAlign = 'center';
            context.fillText(text, 64, 40);
            
            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.position.copy(position);
            sprite.scale.set(0.5, 0.25, 1);
            
            return sprite;
        };
        
        // X-axis label (Red)
        const xLabel = createTextSprite('X', '#ff0000', new THREE.Vector3(5.5, 0, 0));
        this.scene.add(xLabel);
        this.helpers.push(xLabel);
        
        // Y-axis label (Green) 
        const yLabel = createTextSprite('Y', '#00ff00', new THREE.Vector3(0, 5.5, 0));
        this.scene.add(yLabel);
        this.helpers.push(yLabel);
        
        // Z-axis label (Blue)
        const zLabel = createTextSprite('Z', '#0000ff', new THREE.Vector3(0, 0, 5.5));
        this.scene.add(zLabel);
        this.helpers.push(zLabel);
        
        // Add origin marker
        const originGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const originMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const originMarker = new THREE.Mesh(originGeometry, originMaterial);
        originMarker.position.set(0, 0, 0);
        this.scene.add(originMarker);
        this.helpers.push(originMarker);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        
        // Set camera to use Z-up orientation
        this.camera.up.set(0, 0, 1);
        
        // Set initial camera position (adjusted for Z-up)
        const homePos = this.cameraPositions.home;
        this.camera.position.set(homePos.position.x, homePos.position.y, homePos.position.z);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Enhanced shadow settings for Cycles-like quality
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Better soft shadows
        this.renderer.shadowMap.autoUpdate = true;
        
        // Color management for realistic rendering (r128 compatible)
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping; // Cinematic tone mapping
        this.renderer.toneMappingExposure = 0.8; // Slightly darker for more realistic look
        
        // Enhanced rendering quality (r128 compatible)
        this.renderer.physicallyCorrectLights = true; // More realistic light behavior
        this.renderer.gammaFactor = 2.2;
        
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);
    }

    setupLights() {
        // Ambient light with warmer tone (mimicking global illumination)
        const ambientLight = new THREE.AmbientLight(0x404040, 0.2); // Reduced for more dramatic lighting
        this.scene.add(ambientLight);

        // Main directional light (sun-like) with proper Cycles-style positioning
        const directionalLight = new THREE.DirectionalLight(0xfff5e6, 2.5); // Warmer white, higher intensity
        directionalLight.position.set(15, 20, 10);
        directionalLight.castShadow = true;
        
        // Enhanced shadow settings for better quality
        directionalLight.shadow.mapSize.width = 4096;
        directionalLight.shadow.mapSize.height = 4096;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 100;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        directionalLight.shadow.bias = -0.0001;
        directionalLight.shadow.normalBias = 0.02;
        this.scene.add(directionalLight);

        // Key light (mimicking studio lighting)
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
        keyLight.position.set(-10, 15, 8);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        keyLight.shadow.camera.near = 0.1;
        keyLight.shadow.camera.far = 50;
        keyLight.shadow.camera.left = -15;
        keyLight.shadow.camera.right = 15;
        keyLight.shadow.camera.top = 15;
        keyLight.shadow.camera.bottom = -15;
        this.scene.add(keyLight);

        // Fill light (softer, cooler tone)
        const fillLight = new THREE.DirectionalLight(0xadd8e6, 0.8);
        fillLight.position.set(5, 8, -5);
        this.scene.add(fillLight);

        // Rim light for edge definition
        const rimLight = new THREE.DirectionalLight(0xfff8dc, 1.0);
        rimLight.position.set(-8, 5, -10);
        this.scene.add(rimLight);

        // Point lights for accent and local illumination
        const warmPointLight = new THREE.PointLight(0xffaa44, 1.2, 12, 2);
        warmPointLight.position.set(-3, 4, 3);
        warmPointLight.castShadow = true;
        warmPointLight.shadow.mapSize.width = 1024;
        warmPointLight.shadow.mapSize.height = 1024;
        this.scene.add(warmPointLight);

        const coolPointLight = new THREE.PointLight(0x4a90e2, 0.8, 8, 2);
        coolPointLight.position.set(4, 2, -2);
        this.scene.add(coolPointLight);

        // Spot light for dramatic focus (desk area)
        const deskSpotLight = new THREE.SpotLight(0xffffff, 2.0);
        deskSpotLight.position.set(-2, 6, 4);
        deskSpotLight.target.position.set(-2, 0, 0); // Focus on desk area
        deskSpotLight.angle = Math.PI / 6;
        deskSpotLight.penumbra = 0.3;
        deskSpotLight.decay = 2;
        deskSpotLight.distance = 20;
        deskSpotLight.castShadow = true;
        deskSpotLight.shadow.mapSize.width = 2048;
        deskSpotLight.shadow.mapSize.height = 2048;
        this.scene.add(deskSpotLight);
        this.scene.add(deskSpotLight.target);

        // Hemisphere light for subtle sky/ground lighting
        const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x8b4513, 0.6);
        hemisphereLight.position.set(0, 20, 0);
        this.scene.add(hemisphereLight);

        // Area-like lighting using rect area light (if supported)
        if (THREE.RectAreaLight) {
            const rectLight = new THREE.RectAreaLight(0xffffff, 3, 4, 4);
            rectLight.position.set(0, 8, 2);
            rectLight.lookAt(0, 0, 0);
            this.scene.add(rectLight);
        }
    }

    setupControls() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 20;
        this.controls.maxPolarAngle = Math.PI / 1.8;
        
        // Set Z-up orientation for controls
        this.controls.object.up.set(0, 0, 1);
        
        // Enable controls by default (can still use mouse to look around)
        this.controls.enabled = true;
        
        // Set initial target (adjusted for Z-up)
        const homeTarget = this.cameraPositions.home.target;
        this.controls.target.set(homeTarget.x, homeTarget.y, homeTarget.z);
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Mouse movement
        window.addEventListener('mousemove', (event) => this.onMouseMove(event));
        
        // Mouse click
        window.addEventListener('click', (event) => this.onMouseClick(event));
        
        // Keyboard shortcuts
        window.addEventListener('keydown', (event) => this.onKeyDown(event));
        window.addEventListener('keyup', (event) => this.onKeyUp(event));
        
        // Navigation buttons
        const navButtons = document.querySelectorAll('.nav-button');
        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const cameraView = e.target.getAttribute('data-camera');
                this.moveToView(cameraView);
                
                // Update active button
                navButtons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Custom cursor
        this.setupCustomCursor();
        
        // Setup camera controls panel
        this.setupCameraControls();
    }

    setupCameraControls() {
        const toggleButton = document.getElementById('toggle-controls');
        const controlPanel = document.getElementById('camera-controls');
        const applyButton = document.getElementById('apply-camera');
        const getCurrentButton = document.getElementById('get-current');
        const copyCodeButton = document.getElementById('copy-code');
        const codeOutput = document.getElementById('code-output');

        // Toggle panel visibility
        toggleButton.addEventListener('click', () => {
            controlPanel.classList.toggle('hidden');
            toggleButton.textContent = controlPanel.classList.contains('hidden') 
                ? '📹 Camera Controls' 
                : '❌ Close Controls';
        });

        // Apply camera settings
        applyButton.addEventListener('click', () => {
            const x = parseFloat(document.getElementById('cam-x').value);
            const y = parseFloat(document.getElementById('cam-y').value);
            const z = parseFloat(document.getElementById('cam-z').value);
            const targetX = parseFloat(document.getElementById('target-x').value);
            const targetY = parseFloat(document.getElementById('target-y').value);
            const targetZ = parseFloat(document.getElementById('target-z').value);
            const fov = parseFloat(document.getElementById('cam-fov').value);
            const near = parseFloat(document.getElementById('cam-near').value);
            const far = parseFloat(document.getElementById('cam-far').value);

            // Apply camera position
            this.camera.position.set(x, y, z);
            this.controls.target.set(targetX, targetY, targetZ);
            
            // Apply camera properties
            this.camera.fov = fov;
            this.camera.near = near;
            this.camera.far = far;
            this.camera.updateProjectionMatrix();
            
            // Update controls
            this.controls.update();
            
            console.log('Camera updated:', {
                position: { x, y, z },
                target: { targetX, targetY, targetZ },
                fov, near, far
            });
        });

        // Get current camera position with live updates
        getCurrentButton.addEventListener('click', () => {
            this.captureCameraState();
        });

        // Auto-update camera values when moving with WASD
        this.autoUpdateCameraValues = false;
        document.addEventListener('keydown', (e) => {
            if (['w', 'a', 's', 'd', 'q', 'e'].includes(e.key.toLowerCase()) && 
                !controlPanel.classList.contains('hidden')) {
                this.autoUpdateCameraValues = true;
            }
        });

        // Copy comprehensive camera data
        copyCodeButton.addEventListener('click', () => {
            this.captureCameraState(); // Update values first
            this.generateCameraCode();
        });
    }

    captureCameraState() {
        const pos = this.camera.position;
        const target = this.controls.target;
        
        // Calculate distance from camera to target (zoom level)
        const distance = pos.distanceTo(target);
        
        // Get camera rotation (Euler angles)
        const euler = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'XYZ');
        
        // Update all input fields
        document.getElementById('cam-x').value = pos.x.toFixed(5);
        document.getElementById('cam-y').value = pos.y.toFixed(5);
        document.getElementById('cam-z').value = pos.z.toFixed(5);
        document.getElementById('target-x').value = target.x.toFixed(5);
        document.getElementById('target-y').value = target.y.toFixed(5);
        document.getElementById('target-z').value = target.z.toFixed(5);
        document.getElementById('cam-fov').value = this.camera.fov;
        document.getElementById('cam-near').value = this.camera.near;
        document.getElementById('cam-far').value = this.camera.far;
        
        console.log('📹 Camera State Captured:', {
            position: { x: pos.x, y: pos.y, z: pos.z },
            target: { x: target.x, y: target.y, z: target.z },
            rotation: { x: euler.x, y: euler.y, z: euler.z },
            distance: distance,
            fov: this.camera.fov
        });
    }

    generateCameraCode() {
        const x = parseFloat(document.getElementById('cam-x').value);
        const y = parseFloat(document.getElementById('cam-y').value);
        const z = parseFloat(document.getElementById('cam-z').value);
        const targetX = parseFloat(document.getElementById('target-x').value);
        const targetY = parseFloat(document.getElementById('target-y').value);
        const targetZ = parseFloat(document.getElementById('target-z').value);
        const fov = parseFloat(document.getElementById('cam-fov').value);

        // Calculate rotation and distance for additional info
        const pos = new THREE.Vector3(x, y, z);
        const target = new THREE.Vector3(targetX, targetY, targetZ);
        const distance = pos.distanceTo(target);
        const euler = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'XYZ');

        const codeString = `// Camera Position Data
newView: { 
    position: { x: ${x}, y: ${y}, z: ${z} }, 
    target: { x: ${targetX}, y: ${targetY}, z: ${targetZ} },
    info: "Your Custom View Description"
},

// Additional Data for Reference:
// Distance from target: ${distance.toFixed(3)}
// Camera rotation (radians): { x: ${euler.x.toFixed(3)}, y: ${euler.y.toFixed(3)}, z: ${euler.z.toFixed(3)} }
// Camera rotation (degrees): { x: ${(euler.x * 180/Math.PI).toFixed(1)}°, y: ${(euler.y * 180/Math.PI).toFixed(1)}°, z: ${(euler.z * 180/Math.PI).toFixed(1)}° }
// Field of View: ${fov}°

// GSAP Animation Code:
gsap.to(this.camera.position, {
    duration: 2,
    x: ${x},
    y: ${y},
    z: ${z},
    ease: "power2.inOut"
});

gsap.to(this.controls.target, {
    duration: 2,
    x: ${targetX},
    y: ${targetY},
    z: ${targetZ},
    ease: "power2.inOut"
});`;

        const codeOutput = document.getElementById('code-output');
        codeOutput.textContent = codeString;
        codeOutput.style.display = 'block';
        
        // Copy to clipboard
        navigator.clipboard.writeText(codeString).then(() => {
            console.log('📋 Complete camera code copied to clipboard!');
            const copyButton = document.getElementById('copy-code');
            copyButton.textContent = '✅ Copied!';
            setTimeout(() => {
                copyButton.textContent = 'Copy Code';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy code:', err);
        });
    }

    // Method to add new camera positions dynamically
    addCameraPosition(name, position, target, info) {
        this.cameraPositions[name] = {
            position: position,
            target: target,
            info: info
        };
        
        console.log(`✅ New camera position '${name}' added:`, {
            position: position,
            target: target,
            info: info
        });
        
        return this.cameraPositions[name];
    }

    // Method to create smooth camera transition to any position
    animateCameraTo(position, target, duration = 2, easing = "power2.inOut") {
        if (this.isTransitioning) return;
        
        this.isTransitioning = true;
        
        console.log(`🎬 Animating camera to:`, { position, target });
        
        // Animate camera movement
        gsap.to(this.camera.position, {
            duration: duration,
            x: position.x,
            y: position.y,
            z: position.z,
            ease: easing
        });
        
        gsap.to(this.controls.target, {
            duration: duration,
            x: target.x,
            y: target.y,
            z: target.z,
            ease: easing,
            onComplete: () => {
                this.isTransitioning = false;
                console.log(`✅ Camera animation completed`);
            }
        });
    }

    onKeyDown(event) {
        const key = event.key.toLowerCase();
        
        // Prevent default browser behavior for movement keys
        if (['w', 'a', 's', 'd', 'q', 'e', 'f'].includes(key)) {
            event.preventDefault();
        }
        
        switch(key) {
            case 'h':
                this.toggleHelpers();
                break;
            case 'r':
                this.resetCamera();
                break;
            case 'f':
                this.toggleFirstPerson();
                break;
            case 'w':
            case 'a':
            case 's':
            case 'd':
            case 'q':
            case 'e':
                this.keys[key] = true;
                console.log(`Key ${key} pressed - First person: ${this.isFirstPerson}`);
                break;
        }
    }

    onKeyUp(event) {
        const key = event.key.toLowerCase();
        
        if (this.keys.hasOwnProperty(key)) {
            this.keys[key] = false;
        }
    }

    toggleFirstPerson() {
        this.isFirstPerson = !this.isFirstPerson;
        
        if (this.isFirstPerson) {
            // Disable orbit controls for first-person mode
            this.controls.enabled = false;
            console.log('First-person mode enabled. Use WASD to move, QE to go up/down. Press F to toggle back to orbit mode.');
            console.log('Current camera position:', this.camera.position);
            
            // Make sure we can capture keyboard focus
            document.body.focus();
        } else {
            // Re-enable orbit controls
            this.controls.enabled = true;
            console.log('Orbit mode enabled. Use mouse to orbit. Press F to toggle to first-person mode.');
        }
    }

    updateMovement() {
        // Always allow movement, don't check for first-person mode
        
        // Debug: Check if any keys are pressed
        const anyKeyPressed = Object.values(this.keys).some(key => key === true);
        if (anyKeyPressed) {
            console.log('Keys pressed:', this.keys);
        }
        
        // Movement vector
        const movement = new THREE.Vector3();
        
        // Simple movement in world coordinates
        // Forward/Backward (W/S) - move along Y axis
        if (this.keys.w) {
            movement.y += this.moveSpeed;
        }
        if (this.keys.s) {
            movement.y -= this.moveSpeed;
        }
        
        // Left/Right (A/D) - move along X axis
        if (this.keys.a) {
            movement.x -= this.moveSpeed;
        }
        if (this.keys.d) {
            movement.x += this.moveSpeed;
        }
        
        // Up/Down (Q/E) - move along Z axis
        if (this.keys.q) {
            movement.z -= this.moveSpeed;
        }
        if (this.keys.e) {
            movement.z += this.moveSpeed;
        }
        
        // Apply movement if there's any
        if (movement.length() > 0) {
            this.camera.position.add(movement);
            console.log('Moving camera to:', this.camera.position);
            
            // Update orbit controls target to follow camera
            if (this.controls) {
                this.controls.target.add(movement);
            }
        }
    }

    toggleHelpers() {
        this.helpersVisible = !this.helpersVisible;
        this.helpers.forEach(helper => {
            helper.visible = this.helpersVisible;
        });
        console.log(`Helpers ${this.helpersVisible ? 'shown' : 'hidden'}. Press 'H' to toggle.`);
    }

    resetCamera() {
        // Reset to home position
        this.moveToView('home');
        console.log('Camera reset to home position');
    }

    setupCustomCursor() {
        const cursor = document.getElementById('custom-cursor');
        
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX - 10 + 'px';
            cursor.style.top = e.clientY - 10 + 'px';
        });
    }

    loadModel() {
        this.loadingManager = new THREE.LoadingManager();
        
        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const progress = (itemsLoaded / itemsTotal * 100);
            document.getElementById('progress-text').textContent = 
                `Loading 3D Portfolio... ${Math.round(progress)}%`;
        };

        this.loadingManager.onLoad = () => {
            this.hideLoadingScreen();
            this.showWelcomeInfo();
        };

        const loader = new THREE.GLTFLoader(this.loadingManager);
        
        loader.load(
            './wesbite models.glb', // Your GLB file
            (gltf) => {
                this.model = gltf.scene;
                
                // Configure model orientation - Change from Y-up to Z-up
                this.model.scale.set(1, 1, 1);
                this.model.position.set(0, 0, 0);
                
                // Rotate model to convert Y-up to Z-up coordinate system
                // Rotate by 180 degrees around X-axis, 180 degrees around Y-axis, and 180 degrees around Z-axis
                this.model.rotation.order = 'XYZ'; // Set rotation order explicitly
                this.model.rotation.x = Math.PI; // Rotate +180 degrees around X-axis
                this.model.rotation.y = Math.PI; // Rotate +180 degrees around Y-axis
                this.model.rotation.z = Math.PI; // Rotate +180 degrees around Z-axis
                
                // Enable shadows
                this.model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        // Add to intersectable objects for mouse interaction
                        if (child.material) {
                            this.intersectableObjects.push(child);
                        }
                    }
                });
                
                this.scene.add(this.model);
                
                // Initialize interactive manager
                this.interactiveManager = new InteractiveObjectManager(this);
                this.interactiveManager.detectInteractiveObjects(this.model);
                
                console.log('Model loaded successfully!');
            },
            (progress) => {
                // Loading progress
                const percent = (progress.loaded / progress.total * 100);
                console.log('Loading progress: ' + percent + '%');
            },
            (error) => {
                console.error('Error loading model:', error);
                document.getElementById('progress-text').textContent = 'Error loading model. Please check the file path.';
            }
        );
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }

    showWelcomeInfo() {
        setTimeout(() => {
            const infoPanel = document.getElementById('info-panel');
            infoPanel.classList.add('active');
            
            setTimeout(() => {
                infoPanel.classList.remove('active');
            }, 4000);
        }, 1000);
    }

    moveToView(viewName) {
        if (this.isTransitioning || !this.cameraPositions[viewName]) return;
        
        this.isTransitioning = true;
        this.currentView = viewName;
        const targetView = this.cameraPositions[viewName];
        
        // Animate camera movement
        gsap.to(this.camera.position, {
            duration: 2,
            x: targetView.position.x,
            y: targetView.position.y,
            z: targetView.position.z,
            ease: "power2.inOut"
        });
        
        gsap.to(this.controls.target, {
            duration: 2,
            x: targetView.target.x,
            y: targetView.target.y,
            z: targetView.target.z,
            ease: "power2.inOut",
            onComplete: () => {
                this.isTransitioning = false;
                this.showViewInfo(targetView.info);
            }
        });
    }

    showViewInfo(info) {
        const infoPanel = document.getElementById('info-panel');
        const infoContent = infoPanel.querySelector('p');
        
        infoContent.textContent = info;
        infoPanel.classList.add('active');
        
        setTimeout(() => {
            infoPanel.classList.remove('active');
        }, 3000);
    }

    onMouseMove(event) {
        // Update mouse position for raycasting
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Check for object intersections
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.intersectableObjects);
        
        const cursor = document.getElementById('custom-cursor');
        if (intersects.length > 0) {
            cursor.classList.add('hover');
            document.body.style.cursor = 'pointer';
            
            // Handle interactive object hover
            if (this.interactiveManager) {
                this.interactiveManager.handleObjectHover(intersects[0].object, true);
            }
        } else {
            cursor.classList.remove('hover');
            document.body.style.cursor = 'none';
            
            // Clear hover
            if (this.interactiveManager) {
                this.interactiveManager.handleObjectHover(null, false);
            }
        }
    }

    onMouseClick(event) {
        // Handle object clicks
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.intersectableObjects);
        
        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            this.handleObjectClick(clickedObject, intersects[0].point);
        }
    }

    handleObjectClick(object, clickPoint) {
        console.log('Clicked object:', object.name || 'Unnamed object');
        
        // Create a temporary highlight effect
        const originalMaterial = object.material;
        const highlightMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x4a90e2,
            transparent: true,
            opacity: 0.5
        });
        
        object.material = highlightMaterial;
        
        setTimeout(() => {
            object.material = originalMaterial;
        }, 200);
        
        // You can add specific interactions based on object names
        this.createInteractionEffect(clickPoint);
    }

    createInteractionEffect(position) {
        // Create a ripple effect at click position
        const geometry = new THREE.RingGeometry(0.1, 0.3, 16);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x4a90e2,
            transparent: true,
            opacity: 0.8
        });
        const ripple = new THREE.Mesh(geometry, material);
        
        ripple.position.copy(position);
        ripple.lookAt(this.camera.position);
        this.scene.add(ripple);
        
        // Animate ripple
        gsap.to(ripple.scale, {
            duration: 0.5,
            x: 3,
            y: 3,
            z: 3,
            ease: "power2.out"
        });
        
        gsap.to(ripple.material, {
            duration: 0.5,
            opacity: 0,
            ease: "power2.out",
            onComplete: () => {
                this.scene.remove(ripple);
            }
        });
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        
        // Update movement controls
        this.updateMovement();
        
        // Auto-update camera control panel if it's open and user is moving
        if (this.autoUpdateCameraValues && !document.getElementById('camera-controls').classList.contains('hidden')) {
            this.captureCameraState();
        }
        
        // Update controls
        if (this.controls) {
            this.controls.update();
        }
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the 3D Portfolio when page loads
window.addEventListener('DOMContentLoaded', () => {
    new Portfolio3D();
});
