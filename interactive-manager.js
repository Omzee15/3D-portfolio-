class InteractiveObjectManager {
    constructor(portfolio3D) {
        this.portfolio = portfolio3D;
        this.interactiveObjects = new Map();
        this.hoveredObject = null;
        this.selectedObject = null;
        this.originalMaterials = new Map();
        
        this.setupInteractiveObjects();
    }

    setupInteractiveObjects() {
        // Define interactive objects and their behaviors (adjusted for Z-up orientation)
        // You can customize these based on your actual model structure
        this.interactiveObjects.set('desk', {
            type: 'workspace',
            cameraPosition: { x: 2, y: 3, z: 2 },
            cameraTarget: { x: 0, y: -2, z: 1 },
            info: {
                title: "My Workspace",
                description: "This is where I create amazing 3D experiences and develop interactive applications.",
                content: ["3D Modeling", "Web Development", "Creative Coding"]
            }
        });

        this.interactiveObjects.set('computer', {
            type: 'projects',
            cameraPosition: { x: -1, y: 2, z: 1.5 },
            cameraTarget: { x: -1, y: 0, z: 1 },
            info: {
                title: "My Projects",
                description: "A collection of interactive 3D websites, applications, and creative experiments.",
                content: ["React Three Fiber Apps", "WebGL Experiences", "3D Portfolio Sites"]
            }
        });

        this.interactiveObjects.set('artwork', {
            type: 'gallery',
            cameraPosition: { x: -3, y: 2, z: 2 },
            cameraTarget: { x: -2, y: 0, z: 1 },
            info: {
                title: "Creative Gallery",
                description: "Digital art, 3D renders, and experimental visual pieces.",
                content: ["Blender Artwork", "Procedural Textures", "3D Illustrations"]
            }
        });

        this.interactiveObjects.set('books', {
            type: 'about',
            cameraPosition: { x: 1, y: 4, z: 2 },
            cameraTarget: { x: 1, y: 1, z: 1 },
            info: {
                title: "About Me",
                description: "Passionate about creating immersive digital experiences through 3D technology.",
                content: ["3D Artist", "Web Developer", "Creative Technologist"]
            }
        });
    }

    detectInteractiveObjects(model) {
        // This method identifies objects in your GLB model that should be interactive
        model.traverse((child) => {
            if (child.isMesh && child.name) {
                const objectName = child.name.toLowerCase();
                
                // Check if this object matches any of our interactive objects
                for (let [key, config] of this.interactiveObjects) {
                    if (objectName.includes(key) || this.fuzzyMatch(objectName, key)) {
                        this.setupInteractiveObject(child, key, config);
                        break;
                    }
                }
            }
        });
    }

    fuzzyMatch(objectName, targetName) {
        // Simple fuzzy matching for object names
        const variations = {
            'desk': ['table', 'workspace', 'desk'],
            'computer': ['laptop', 'monitor', 'screen', 'pc'],
            'artwork': ['picture', 'painting', 'frame', 'art'],
            'books': ['book', 'shelf', 'library', 'stack']
        };
        
        if (variations[targetName]) {
            return variations[targetName].some(variation => 
                objectName.includes(variation)
            );
        }
        return false;
    }

    setupInteractiveObject(mesh, key, config) {
        // Store original material
        this.originalMaterials.set(mesh.uuid, mesh.material.clone());
        
        // Add to portfolio's intersectable objects
        if (!this.portfolio.intersectableObjects.includes(mesh)) {
            this.portfolio.intersectableObjects.push(mesh);
        }
        
        // Add interaction data
        mesh.userData = {
            interactiveKey: key,
            config: config,
            isInteractive: true
        };
        
        console.log(`Set up interactive object: ${key} (${mesh.name})`);
    }

    handleObjectHover(object, isHovering) {
        if (!object.userData.isInteractive) return;

        if (isHovering && this.hoveredObject !== object) {
            this.clearHover();
            this.hoveredObject = object;
            this.applyHoverEffect(object);
            this.showObjectTooltip(object);
        } else if (!isHovering && this.hoveredObject === object) {
            this.clearHover();
        }
    }

    applyHoverEffect(object) {
        // Create hover material
        const originalMaterial = this.originalMaterials.get(object.uuid);
        if (originalMaterial) {
            const hoverMaterial = originalMaterial.clone();
            
            // Enhance material for hover effect
            if (hoverMaterial.emissive) {
                hoverMaterial.emissive.setHex(0x222244);
            }
            if (hoverMaterial.color) {
                hoverMaterial.color.multiplyScalar(1.2);
            }
            
            object.material = hoverMaterial;
        }
    }

    clearHover() {
        if (this.hoveredObject) {
            // Restore original material
            const originalMaterial = this.originalMaterials.get(this.hoveredObject.uuid);
            if (originalMaterial) {
                this.hoveredObject.material = originalMaterial;
            }
            this.hoveredObject = null;
            this.hideObjectTooltip();
        }
    }

    handleObjectClick(object, clickPoint) {
        if (!object.userData.isInteractive) return;

        const config = object.userData.config;
        
        // Animate to object's camera position
        this.portfolio.isTransitioning = true;
        
        gsap.to(this.portfolio.camera.position, {
            duration: 2.5,
            x: config.cameraPosition.x,
            y: config.cameraPosition.y,
            z: config.cameraPosition.z,
            ease: "power2.inOut"
        });
        
        gsap.to(this.portfolio.controls.target, {
            duration: 2.5,
            x: config.cameraTarget.x,
            y: config.cameraTarget.y,
            z: config.cameraTarget.z,
            ease: "power2.inOut",
            onComplete: () => {
                this.portfolio.isTransitioning = false;
                this.showDetailedInfo(config.info);
            }
        });

        // Create selection effect
        this.createSelectionEffect(object, clickPoint);
    }

    createSelectionEffect(object, clickPoint) {
        // Create particles around the clicked object
        const particleCount = 20;
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.02, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(Math.random(), 0.7, 0.6),
                transparent: true,
                opacity: 0.8
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Random position around click point
            particle.position.copy(clickPoint);
            particle.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5
            ));
            
            particles.add(particle);
            
            // Animate particles
            gsap.to(particle.position, {
                duration: 1.5,
                x: particle.position.x + (Math.random() - 0.5) * 2,
                y: particle.position.y + Math.random() * 2,
                z: particle.position.z + (Math.random() - 0.5) * 2,
                ease: "power2.out"
            });
            
            gsap.to(particle.material, {
                duration: 1.5,
                opacity: 0,
                ease: "power2.out"
            });
        }
        
        this.portfolio.scene.add(particles);
        
        setTimeout(() => {
            this.portfolio.scene.remove(particles);
        }, 1500);
    }

    showObjectTooltip(object) {
        const config = object.userData.config;
        const tooltip = this.createTooltip(config.info.title);
        document.body.appendChild(tooltip);
        
        // Position tooltip near cursor
        document.addEventListener('mousemove', this.updateTooltipPosition.bind(this, tooltip));
    }

    createTooltip(text) {
        const tooltip = document.createElement('div');
        tooltip.className = 'object-tooltip';
        tooltip.textContent = text;
        tooltip.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 14px;
            pointer-events: none;
            z-index: 1000;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        setTimeout(() => {
            tooltip.style.opacity = '1';
        }, 100);
        
        return tooltip;
    }

    updateTooltipPosition(tooltip, event) {
        tooltip.style.left = (event.clientX + 15) + 'px';
        tooltip.style.top = (event.clientY - 35) + 'px';
    }

    hideObjectTooltip() {
        const tooltip = document.querySelector('.object-tooltip');
        if (tooltip) {
            tooltip.style.opacity = '0';
            setTimeout(() => {
                if (tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
            }, 300);
            document.removeEventListener('mousemove', this.updateTooltipPosition);
        }
    }

    showDetailedInfo(info) {
        // Create detailed info panel
        const detailPanel = document.createElement('div');
        detailPanel.className = 'detail-panel';
        detailPanel.innerHTML = `
            <div class="detail-content">
                <button class="close-btn">&times;</button>
                <h2>${info.title}</h2>
                <p>${info.description}</p>
                <ul>
                    ${info.content.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
        `;
        
        detailPanel.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            opacity: 0;
            transition: opacity 0.5s ease;
        `;
        
        const detailContent = detailPanel.querySelector('.detail-content');
        detailContent.style.cssText = `
            background: rgba(20, 20, 20, 0.95);
            color: white;
            padding: 40px;
            border-radius: 15px;
            max-width: 500px;
            width: 90%;
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            position: relative;
            transform: translateY(50px);
            transition: transform 0.5s ease;
        `;
        
        const closeBtn = detailPanel.querySelector('.close-btn');
        closeBtn.style.cssText = `
            position: absolute;
            top: 15px;
            right: 20px;
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        document.body.appendChild(detailPanel);
        
        // Animate in
        setTimeout(() => {
            detailPanel.style.opacity = '1';
            detailContent.style.transform = 'translateY(0)';
        }, 100);
        
        // Close functionality
        const closePanel = () => {
            detailPanel.style.opacity = '0';
            detailContent.style.transform = 'translateY(50px)';
            setTimeout(() => {
                document.body.removeChild(detailPanel);
            }, 500);
        };
        
        closeBtn.addEventListener('click', closePanel);
        detailPanel.addEventListener('click', (e) => {
            if (e.target === detailPanel) closePanel();
        });
    }
}

// Export for use in main script
window.InteractiveObjectManager = InteractiveObjectManager;
