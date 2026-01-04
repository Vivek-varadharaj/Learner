const surpriseButton = document.getElementById('surpriseButton');
const message = document.getElementById('message');
const rosesContainer = document.getElementById('rosesContainer');
const sparklesContainer = document.getElementById('sparklesContainer');
const imagesGrid = document.getElementById('imagesGrid');

let rosesFalling = false;

// Rose emoji
const rose = '🌹';
const sparkles = ['✨', '⭐', '💫', '🌟'];

// Image files array
const imageFiles = [
    'WhatsApp Image 2026-01-05 at 1.07.12 AM.jpeg',
    'WhatsApp Image 2026-01-05 at 1.07.12 AM (1).jpeg',
    'WhatsApp Image 2026-01-05 at 1.07.12 AM (2).jpeg',
    'WhatsApp Image 2026-01-05 at 1.07.12 AM (3).jpeg',
    'WhatsApp Image 2026-01-05 at 1.07.12 AM (4).jpeg',
    'WhatsApp Image 2026-01-05 at 1.07.12 AM (5).jpeg',
    'WhatsApp Image 2026-01-05 at 1.07.12 AM (6).jpeg',
    'WhatsApp Image 2026-01-05 at 1.07.12 AM (7).jpeg',
    'WhatsApp Image 2026-01-05 at 1.07.12 AM (8).jpeg'
];

// Initialize image grid
function initializeImageGrid() {
    imageFiles.forEach((imageFile, index) => {
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-item';
        gridItem.style.animationDelay = (index * 0.1) + 's';
        
        const img = document.createElement('img');
        img.src = imageFile;
        img.alt = `Image ${index + 1}`;
        img.loading = 'lazy';
        
        gridItem.appendChild(img);
        imagesGrid.appendChild(gridItem);
    });
}

// Initialize grid on page load
initializeImageGrid();

surpriseButton.addEventListener('click', function() {
    if (rosesFalling) return;
    
    rosesFalling = true;
    
    // Show image grid
    imagesGrid.classList.add('active');
    
    // Create sparkles on button click
    createButtonSparkles();
    
    // Update the message with delay for smooth transition
    setTimeout(() => {
        message.innerHTML = `
            <h1>For you my Shuttumani...</h1>
            <p>Anything for your punjiri.</p>
        `;
        message.classList.add('updated');
    }, 300);
    
    // Hide the button with animation
    surpriseButton.style.transform = 'scale(0)';
    surpriseButton.style.opacity = '0';
    setTimeout(() => {
        surpriseButton.style.display = 'none';
    }, 300);
    
    // Start falling roses animation
    setTimeout(() => {
        startFallingRoses();
        startSparkles();
    }, 500);
});

function createButtonSparkles() {
    // Create sparkles around the button
    for (let i = 0; i < 12; i++) {
        setTimeout(() => {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
            
            const angle = (i / 12) * Math.PI * 2;
            const distance = 80;
            const startX = surpriseButton.offsetLeft + surpriseButton.offsetWidth / 2;
            const startY = surpriseButton.offsetTop + surpriseButton.offsetHeight / 2;
            
            sparkle.style.left = startX + 'px';
            sparkle.style.top = startY + 'px';
            sparkle.style.animationDelay = (i * 0.05) + 's';
            
            sparklesContainer.appendChild(sparkle);
            
            // Remove sparkle after animation
            setTimeout(() => {
                if (sparkle.parentNode) {
                    sparkle.parentNode.removeChild(sparkle);
                }
            }, 3000);
        }, i * 50);
    }
}

function startSparkles() {
    // Create random sparkles during the animation
    const sparkleInterval = setInterval(() => {
        if (!rosesFalling) {
            clearInterval(sparkleInterval);
            return;
        }
        
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
        
        sparkle.style.left = Math.random() * 100 + '%';
        sparkle.style.top = (60 + Math.random() * 30) + '%';
        sparkle.style.animationDuration = (2 + Math.random() * 2) + 's';
        
        sparklesContainer.appendChild(sparkle);
        
        setTimeout(() => {
            if (sparkle.parentNode) {
                sparkle.parentNode.removeChild(sparkle);
            }
        }, 4000);
    }, 800);
    
    // Stop sparkles after 12 seconds
    setTimeout(() => {
        clearInterval(sparkleInterval);
    }, 12000);
}

function startFallingRoses() {
    // Create roses falling continuously
    const createRose = () => {
        const roseElement = document.createElement('div');
        roseElement.className = 'rose';
        roseElement.textContent = rose;
        
        // Random horizontal position
        const leftPosition = Math.random() * 100;
        roseElement.style.left = leftPosition + '%';
        
        // Random animation duration (4-7 seconds for slower, more elegant fall)
        const duration = 4 + Math.random() * 3;
        roseElement.style.animationDuration = duration + 's';
        
        // Random delay (0-1.5 seconds)
        const delay = Math.random() * 1.5;
        roseElement.style.animationDelay = delay + 's';
        
        // Random scale for variety
        const scale = 0.8 + Math.random() * 0.4;
        roseElement.style.transform = `scale(${scale})`;
        
        rosesContainer.appendChild(roseElement);
        
        // Remove rose after animation completes
        setTimeout(() => {
            if (roseElement.parentNode) {
                roseElement.parentNode.removeChild(roseElement);
            }
        }, (duration + delay) * 1000);
    };
    
    // Create initial burst of roses
    for (let i = 0; i < 25; i++) {
        setTimeout(() => createRose(), i * 150);
    }
    
    // Continue creating roses for 12 seconds
    const roseInterval = setInterval(() => {
        createRose();
    }, 250);
    
    // Stop creating new roses after 12 seconds, but let existing ones finish
    setTimeout(() => {
        clearInterval(roseInterval);
    }, 12000);
}

