// ============================================
// TECH ANIMATION SYSTEM - MZR TECH
// Professional Particle & Glow Animation
// ============================================

(function() {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================
    const CONFIG = {
        // Particle settings
        particleCount: 120,
        particleSize: { min: 1.5, max: 3.5 },
        particleSpeed: 0.35,
        
        // Connection settings
        connectionDistance: 150,
        connectionOpacity: 0.25,
        
        // Color schemes (tech vibe)
        colors: {
            primary: '#f97316',    // Orange
            secondary: '#dc2626',  // Red
            accent: '#ff8c42',     // Light orange
            glow: '#ffaa66',       // Glow color
            particles: ['#f97316', '#ff8c42', '#ffb347', '#dc2626', '#ff6b35']
        },
        
        // Animation settings
        mouseRadius: 120,
        pulseEnabled: true,
        waveEffect: true,
        
        // Canvas settings
        zIndex: -1,
        opacity: 0.85
    };

    // ============================================
    // DOM ELEMENTS
    // ============================================
    let canvas, ctx;
    let particles = [];
    let mouseX = null, mouseY = null;
    let animationId = null;
    let timeOffset = 0;
    let resizeTimeout;

    // ============================================
    // PARTICLE CLASS
    // ============================================
    class Particle {
        constructor(width, height) {
            this.width = width;
            this.height = height;
            this.reset();
        }
        
        reset() {
            this.x = Math.random() * this.width;
            this.y = Math.random() * this.height;
            this.size = CONFIG.particleSize.min + Math.random() * (CONFIG.particleSize.max - CONFIG.particleSize.min);
            this.speedX = (Math.random() - 0.5) * CONFIG.particleSpeed;
            this.speedY = (Math.random() - 0.5) * CONFIG.particleSpeed;
            this.originalX = this.x;
            this.originalY = this.y;
            this.waveAmplitude = Math.random() * 30 + 10;
            this.waveSpeed = 0.5 + Math.random() * 0.8;
            this.wavePhaseX = Math.random() * Math.PI * 2;
            this.wavePhaseY = Math.random() * Math.PI * 2;
            this.color = CONFIG.colors.particles[Math.floor(Math.random() * CONFIG.colors.particles.length)];
            this.opacity = 0.4 + Math.random() * 0.5;
            this.pulseSpeed = 0.5 + Math.random() * 0.8;
            this.pulsePhase = Math.random() * Math.PI * 2;
        }
        
        update(mouseX, mouseY, time) {
            // Wave motion effect
            if (CONFIG.waveEffect) {
                this.x = this.originalX + Math.sin(time * this.waveSpeed + this.wavePhaseX) * (this.waveAmplitude * 0.3);
                this.y = this.originalY + Math.cos(time * this.waveSpeed * 0.7 + this.wavePhaseY) * (this.waveAmplitude * 0.3);
            } else {
                this.x += this.speedX;
                this.y += this.speedY;
            }
            
            // Mouse interaction (repel effect)
            if (mouseX !== null && mouseY !== null) {
                const dx = this.x - mouseX;
                const dy = this.y - mouseY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const radius = CONFIG.mouseRadius;
                
                if (distance < radius) {
                    const angle = Math.atan2(dy, dx);
                    const force = (radius - distance) / radius;
                    const repelX = Math.cos(angle) * force * 2.5;
                    const repelY = Math.sin(angle) * force * 2.5;
                    this.x += repelX;
                    this.y += repelY;
                }
            }
            
            // Boundary check with smooth wrapping
            if (this.x < -50) this.x = this.width + 50;
            if (this.x > this.width + 50) this.x = -50;
            if (this.y < -50) this.y = this.height + 50;
            if (this.y > this.height + 50) this.y = -50;
        }
        
        draw(ctx, time) {
            // Pulse effect for size
            let currentSize = this.size;
            if (CONFIG.pulseEnabled) {
                const pulse = Math.sin(time * this.pulseSpeed + this.pulsePhase) * 0.3 + 0.7;
                currentSize = this.size * (0.7 + pulse * 0.3);
            }
            
            // Draw glow effect
            ctx.save();
            ctx.shadowBlur = 8;
            ctx.shadowColor = CONFIG.colors.glow;
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
            
            // Gradient fill for particles
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, currentSize);
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(1, 'rgba(249, 115, 22, 0.2)');
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Inner highlight
            ctx.beginPath();
            ctx.arc(this.x - 0.5, this.y - 0.5, currentSize * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.fill();
            
            ctx.restore();
        }
    }

    // ============================================
    // CREATE DYNAMIC GRADIENT BACKGROUND
    // ============================================
    function drawDynamicBackground(ctx, width, height, time) {
        // Animated gradient background
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        const hue1 = 25 + Math.sin(time * 0.2) * 5;     // Orange range
        const hue2 = 10 + Math.cos(time * 0.25) * 5;    // Red-orange range
        
        gradient.addColorStop(0, `hsl(${hue1}, 85%, 8%)`);
        gradient.addColorStop(0.5, `hsl(20, 80%, 12%)`);
        gradient.addColorStop(1, `hsl(${hue2}, 90%, 6%)`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Add subtle grid pattern
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.08)';
        ctx.lineWidth = 0.5;
        const gridSize = 40;
        for (let x = 0; x < width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }

    // ============================================
    // DRAW CONNECTIONS BETWEEN PARTICLES
    // ============================================
    function drawConnections(ctx, particles, mouseX, mouseY, time) {
        // Create gradient for connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < CONFIG.connectionDistance) {
                    const opacity = CONFIG.connectionOpacity * (1 - distance / CONFIG.connectionDistance);
                    const gradient = ctx.createLinearGradient(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
                    gradient.addColorStop(0, `rgba(249, 115, 22, ${opacity})`);
                    gradient.addColorStop(1, `rgba(220, 38, 38, ${opacity * 0.7})`);
                    
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }
        }
        
        // Draw mouse connections (if mouse is on canvas)
        if (mouseX !== null && mouseY !== null) {
            for (let i = 0; i < particles.length; i++) {
                const dx = particles[i].x - mouseX;
                const dy = particles[i].y - mouseY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < CONFIG.connectionDistance) {
                    const opacity = 0.35 * (1 - distance / CONFIG.connectionDistance);
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(mouseX, mouseY);
                    ctx.strokeStyle = `rgba(255, 140, 66, ${opacity})`;
                    ctx.lineWidth = 1.2;
                    ctx.stroke();
                }
            }
        }
    }

    // ============================================
    // DRAW FLOATING TECH ICONS / SYMBOLS
    // ============================================
    const techSymbols = ['</>', '{}', '()', '[]', '=>', '←', '→', '⚡', '●', '◆', '★', '∞', '∑', '∫', 'λ', 'β', 'α', 'ω', 'π', '√'];
    
    function drawTechSymbols(ctx, width, height, time) {
        // Only draw a few symbols for elegance, not too crowded
        const symbolCount = 12;
        ctx.font = 'bold 14px "Inter", monospace';
        ctx.shadowBlur = 0;
        
        for (let i = 0; i < symbolCount; i++) {
            const x = (Math.sin(time * 0.2 + i) * 0.5 + 0.5) * width;
            const y = (Math.cos(time * 0.15 + i * 2) * 0.5 + 0.5) * height;
            const opacity = 0.08 + Math.sin(time * 0.8 + i) * 0.04;
            const symbol = techSymbols[i % techSymbols.length];
            
            ctx.fillStyle = `rgba(249, 115, 22, ${opacity})`;
            ctx.fillText(symbol, x, y);
        }
    }

    // ============================================
    // ANIMATION LOOP
    // ============================================
    let lastTimestamp = 0;
    
    function animate(timestamp) {
        if (!canvas || !ctx) return;
        
        const time = timestamp * 0.002; // Convert to seconds for smooth animation
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas with animated background
        drawDynamicBackground(ctx, width, height, time);
        
        // Update and draw all particles
        for (let i = 0; i < particles.length; i++) {
            particles[i].update(mouseX, mouseY, time);
            particles[i].draw(ctx, time);
        }
        
        // Draw connections between particles
        drawConnections(ctx, particles, mouseX, mouseY, time);
        
        // Draw floating tech symbols
        drawTechSymbols(ctx, width, height, time);
        
        // Add subtle light flare effect
        const flareX = (Math.sin(time * 0.3) * 0.5 + 0.5) * width;
        const flareY = (Math.cos(time * 0.25) * 0.5 + 0.5) * height;
        const flareGradient = ctx.createRadialGradient(flareX, flareY, 0, flareX, flareY, 200);
        flareGradient.addColorStop(0, 'rgba(249, 115, 22, 0.03)');
        flareGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = flareGradient;
        ctx.fillRect(0, 0, width, height);
        
        animationId = requestAnimationFrame(animate);
    }

    // ============================================
    // RESIZE HANDLER
    // ============================================
    function resizeCanvas() {
        if (!canvas) return;
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Reinitialize particles for new dimensions
        if (particles.length > 0) {
            for (let i = 0; i < particles.length; i++) {
                particles[i].width = canvas.width;
                particles[i].height = canvas.height;
                particles[i].reset();
            }
        }
    }

    // ============================================
    // MOUSE TRACKING
    // ============================================
    function handleMouseMove(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        let clientX, clientY;
        
        if (e.touches) {
            // Touch support for mobile
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        mouseX = (clientX - rect.left) * scaleX;
        mouseY = (clientY - rect.top) * scaleY;
        
        // Boundary clamping
        mouseX = Math.max(0, Math.min(canvas.width, mouseX));
        mouseY = Math.max(0, Math.min(canvas.height, mouseY));
    }
    
    function handleMouseLeave() {
        mouseX = null;
        mouseY = null;
    }

    // ============================================
    // INITIALIZATION
    // ============================================
    function init() {
        // Create canvas element
        canvas = document.createElement('canvas');
        canvas.id = 'techAnimationCanvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.zIndex = CONFIG.zIndex;
        canvas.style.pointerEvents = 'none';
        canvas.style.opacity = CONFIG.opacity;
        
        // Insert canvas at the beginning of body
        document.body.insertBefore(canvas, document.body.firstChild);
        
        // Set body background to transparent to show canvas
        document.body.style.backgroundColor = 'transparent';
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        
        // Adjust main containers to have relative positioning and proper background
        const allContainers = document.querySelectorAll('.container, .register-header, .section-card, .calculator');
        allContainers.forEach(container => {
            container.style.position = 'relative';
            container.style.zIndex = '1';
        });
        
        // Make header and cards slightly transparent to show animation behind
        const header = document.querySelector('.register-header');
        if (header) {
            header.style.backgroundColor = 'rgba(255, 255, 255, 0.96)';
            header.style.backdropFilter = 'blur(10px)';
        }
        
        // Style cards with subtle transparency
        const cards = document.querySelectorAll('.section-card');
        cards.forEach(card => {
            card.style.backgroundColor = 'rgba(255, 255, 255, 0.97)';
            card.style.backdropFilter = 'blur(2px)';
        });
        
        ctx = canvas.getContext('2d');
        
        // Set initial size
        resizeCanvas();
        
        // Create particles
        particles = [];
        for (let i = 0; i < CONFIG.particleCount; i++) {
            particles.push(new Particle(canvas.width, canvas.height));
        }
        
        // Event listeners
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                resizeCanvas();
            }, 100);
        });
        
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);
        
        // Touch support for mobile
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            handleMouseMove(e);
        });
        canvas.addEventListener('touchend', handleMouseLeave);
        
        // Start animation
        animationId = requestAnimationFrame(animate);
        
        console.log('✨ Tech Animation initialized | MZR TECH');
    }
    
    // ============================================
    // ADDITIONAL EFFECT: GLOWING CURSOR TRAIL
    // ============================================
    let cursorTrail = [];
    
    function addCursorTrailEffect() {
        const trailCanvas = document.createElement('canvas');
        trailCanvas.style.position = 'fixed';
        trailCanvas.style.top = '0';
        trailCanvas.style.left = '0';
        trailCanvas.style.width = '100%';
        trailCanvas.style.height = '100%';
        trailCanvas.style.pointerEvents = 'none';
        trailCanvas.style.zIndex = '9999';
        document.body.appendChild(trailCanvas);
        
        const trailCtx = trailCanvas.getContext('2d');
        let trailAnimationId;
        
        function updateTrailSize() {
            trailCanvas.width = window.innerWidth;
            trailCanvas.height = window.innerHeight;
        }
        
        updateTrailSize();
        window.addEventListener('resize', updateTrailSize);
        
        document.addEventListener('mousemove', (e) => {
            cursorTrail.push({ x: e.clientX, y: e.clientY, life: 1.0 });
            if (cursorTrail.length > 15) cursorTrail.shift();
        });
        
        function drawTrail() {
            if (!trailCtx) return;
            trailCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
            
            for (let i = 0; i < cursorTrail.length; i++) {
                const point = cursorTrail[i];
                const age = i / cursorTrail.length;
                const size = 8 * (1 - age);
                const opacity = 0.4 * (1 - age);
                
                trailCtx.beginPath();
                trailCtx.arc(point.x, point.y, size, 0, Math.PI * 2);
                trailCtx.fillStyle = `rgba(249, 115, 22, ${opacity})`;
                trailCtx.fill();
                
                // Inner glow
                trailCtx.beginPath();
                trailCtx.arc(point.x, point.y, size * 0.5, 0, Math.PI * 2);
                trailCtx.fillStyle = `rgba(255, 140, 66, ${opacity * 1.2})`;
                trailCtx.fill();
            }
            
            trailAnimationId = requestAnimationFrame(drawTrail);
        }
        
        drawTrail();
    }
    
    // ============================================
    // START EVERYTHING WHEN PAGE LOADS
    // ============================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            init();
            // Optional: enable cursor trail for extra wow effect
            // addCursorTrailEffect(); // Uncomment for glowing trail
        });
    } else {
        init();
        // addCursorTrailEffect();
    }
    
    // ============================================
    // EXPOSE CONTROLS (optional for debugging)
    // ============================================
    window.techAnimation = {
        pause: () => {
            if (animationId) cancelAnimationFrame(animationId);
            animationId = null;
        },
        resume: () => {
            if (!animationId) animationId = requestAnimationFrame(animate);
        },
        config: CONFIG
    };
    
})();