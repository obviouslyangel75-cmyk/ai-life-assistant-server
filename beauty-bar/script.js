// Three.js 3D Background Animation
function initThreeJS() {
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x00000000, 0);
    container.appendChild(renderer.domElement);
    
    camera.position.z = 5;

    // Create geometric shapes for beauty theme
    const geometries = [
        new THREE.IcosahedronGeometry(1, 4),
        new THREE.OctahedronGeometry(1.5),
        new THREE.TorusGeometry(1.2, 0.4, 16, 100),
        new THREE.SphereGeometry(1, 32, 32),
    ];

    const colors = [0xd4a574, 0x8b6f47, 0xe8a66f, 0xffd700];
    const meshes = [];

    geometries.forEach((geometry, index) => {
        const material = new THREE.MeshPhongMaterial({
            color: colors[index],
            wireframe: false,
            shininess: 100,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = (Math.random() - 0.5) * 8;
        mesh.position.y = (Math.random() - 0.5) * 8;
        mesh.position.z = (Math.random() - 0.5) * 8;
        mesh.rotation.x = Math.random() * Math.PI;
        mesh.rotation.y = Math.random() * Math.PI;

        scene.add(mesh);
        meshes.push(mesh);
    });

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);

        meshes.forEach((mesh) => {
            mesh.rotation.x += 0.001;
            mesh.rotation.y += 0.002;
            mesh.position.z += Math.sin(Date.now() * 0.0001) * 0.01;
        });

        renderer.render(scene, camera);
    }

    animate();

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Initialize 3D scene
document.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
});

// Smooth scrolling
function scrollToBooking() {
    document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
}

// Mobile menu toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
    });
}

// Navigation links smooth scroll
document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
            if (navLinks.style.display === 'flex') {
                navLinks.style.display = 'none';
            }
        }
    });
});

// Booking form submission
const bookingForm = document.getElementById('bookingForm');
if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            service: document.getElementById('service').value,
            date: document.getElementById('date').value,
            time: document.getElementById('time').value,
            notes: document.getElementById('notes').value,
        };

        // Simulate booking submission
        console.log('Booking submitted:', formData);

        // Show success message
        const successMessage = document.createElement('div');
        successMessage.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4caf50;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        successMessage.textContent = '✓ Booking request submitted! We\'ll confirm shortly.';
        document.body.appendChild(successMessage);

        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);

        // Remove message after 5 seconds
        setTimeout(() => {
            successMessage.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => successMessage.remove(), 300);
        }, 5000);

        // Reset form
        bookingForm.reset();
    });
}

// Add scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px',
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.6s ease-out forwards';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.service-card, .about-content, .booking-form, .booking-info').forEach((el) => {
    el.style.opacity = '0';
    observer.observe(el);
});

// Set minimum date to today
const dateInput = document.getElementById('date');
if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
}