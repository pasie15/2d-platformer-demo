// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions (match CSS or desired size)
canvas.width = 800;
canvas.height = 600;

// Load images
const images = {
    background: new Image(),
    obstacles: new Image(),
    ground: new Image(),
    player: new Image(),
    enemy: new Image()
};

// Game state
let gameState = 'playing'; // 'playing', 'gameOver'

// Track loaded images
let imagesLoaded = 0;
const totalImages = Object.keys(images).length;

// Define ground level
const groundLevelY = canvas.height - 50;

// Image loading handler
function handleImageLoad() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        console.log('All images loaded, starting game...');
        // Start the game once all images are loaded
        gameLoop();
    }
}

// Set image sources and add load event listeners
images.background.src = 'sky_background.png';
images.background.onload = handleImageLoad;

images.obstacles.src = 'obstacles.png';
images.obstacles.onload = handleImageLoad;

images.ground.src = 'ground_texture.png';
images.ground.onload = handleImageLoad;

images.player.src = 'warrior.png';
images.player.onload = handleImageLoad;

images.enemy.src = 'enemy.png';
images.enemy.onload = handleImageLoad;

// Player object with color property
const player = {
    x: 50,
    y: groundLevelY - 80, // Start above the ground level
    width: 60,
    height: 80,
    speed: 5,
    velocityX: 0,
    velocityY: 0,
    isJumping: false,
    gravity: 0.5,
    facingDirection: 'right', // 'left' or 'right'
    isAttacking: false,
    attackBox: { offsetX: 10, offsetY: 10, width: 100, height: 50 },
    attackDuration: 15, // In frames
    attackTimer: 0,
    attackCooldown: 30, // In frames
    cooldownTimer: 0,
    maxHealth: 10,
    currentHealth: 10,
    isInvincible: false,
    invincibilityDuration: 60, // Frames of invincibility after being hit
    invincibilityTimer: 0,
    color: 'blue' // Add color property for rectangle drawing
};
// Enemy structure and array
const enemyDefaults = {
    width: 50,
    height: 60,
    speed: 1,
    health: 1, // Initialize health to 1 as requested
    justHit: false, // Flag to prevent multiple hits per attack swing
    color: 'red' // Add color property for rectangle drawing
};

let enemies = [];

// Function to create an enemy instance
function createEnemy(x, y, patrolRangeStart, patrolRangeEnd) {
    return {
        ...enemyDefaults, // Spread default properties
        x: x,
        y: y,
        patrolRangeStart: patrolRangeStart,
        patrolRangeEnd: patrolRangeEnd,
        direction: 1 // 1 for right, -1 for left
    };
}

// Instantiate enemies
enemies.push(createEnemy(300, groundLevelY - enemyDefaults.height, 250, 450));
enemies.push(createEnemy(600, groundLevelY - enemyDefaults.height, 550, 750));

// Obstacles
const obstacleTypes = {
    SPIKE: { width: 30, height: 30, damage: 0, deadly: false, imageX: 0, imageY: 0 },
    CRATE: { width: 40, height: 40, damage: 0, deadly: false, solid: true, imageX: 40, imageY: 0 },
    STONE: { width: 40, height: 40, damage: 0, deadly: false, solid: true, imageX: 0, imageY: 40 }
};

let obstacles = [];

// Function to create an obstacle instance
function createObstacle(type, x, y) {
    return {
        ...obstacleTypes[type],
        x: x,
        y: y,
        type: type
    };
}

// Instantiate obstacles
obstacles.push(createObstacle('SPIKE', 200, groundLevelY - obstacleTypes.SPIKE.height));
obstacles.push(createObstacle('CRATE', 400, groundLevelY - obstacleTypes.CRATE.height));
obstacles.push(createObstacle('STONE', 700, groundLevelY - obstacleTypes.STONE.height));
obstacles.push(createObstacle('SPIKE', 500, groundLevelY - obstacleTypes.SPIKE.height));

// Keyboard input state
const keysPressed = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false, // Or Space for jump
    Space: false,
    KeyZ: false // Attack key
};

// --- Drawing ---
function drawBackground() {
    // Draw the background image
    ctx.drawImage(images.background, 0, 0, canvas.width, canvas.height);
}

// Draw the ground with texture
function drawGround() {
    // Calculate how many tiles we need to cover the width of the canvas
    const tileWidth = images.ground.width;
    const tilesNeeded = Math.ceil(canvas.width / tileWidth);
    
    // Draw the ground texture tiled across the width of the canvas
    for (let i = 0; i < tilesNeeded; i++) {
        ctx.drawImage(
            images.ground,
            i * tileWidth, groundLevelY,
            tileWidth, canvas.height - groundLevelY
        );
    }
}

function drawPlayer() {
    // If player is invincible, make them flash
    if (player.isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.globalAlpha = 0.5; // Semi-transparent when flashing
    }
    
    ctx.save(); // Save the current context state
    
    if (player.facingDirection === 'left') {
        // Flip the sprite horizontally for left-facing
        ctx.scale(-1, 1);
        ctx.drawImage(images.player, -player.x - player.width, player.y, player.width, player.height);
    } else {
        // Normal drawing for right-facing
        ctx.drawImage(images.player, player.x, player.y, player.width, player.height);
    }
    
    ctx.restore(); // Restore the context state
    ctx.globalAlpha = 1.0; // Reset transparency
}

function drawAttackBox() {
    if (!player.isAttacking) return; // Only draw if attacking

    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'; // Semi-transparent red

    let attackX = player.x;
    const attackY = player.y + player.attackBox.offsetY;

    if (player.facingDirection === 'right') {
        // Position relative to player's right side
        attackX = player.x + player.width + player.attackBox.offsetX;
    } else { // facing 'left'
        // Position relative to player's left side, accounting for box width
        attackX = player.x - player.attackBox.width - player.attackBox.offsetX;
    }

    ctx.fillRect(attackX, attackY, player.attackBox.width, player.attackBox.height);
}

function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.save(); // Save the current context state
        
        if (enemy.direction === -1) {
            // Flip the sprite horizontally for left-facing enemies
            ctx.scale(-1, 1);
            ctx.drawImage(images.enemy, -enemy.x - enemy.width, enemy.y, enemy.width, enemy.height);
        } else {
            // Normal drawing for right-facing enemies
            ctx.drawImage(images.enemy, enemy.x, enemy.y, enemy.width, enemy.height);
        }
        
        ctx.restore(); // Restore the context state
    });
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        // Draw the obstacle using the appropriate part of the obstacles sprite sheet
        ctx.drawImage(
            images.obstacles,
            obstacle.imageX, obstacle.imageY,  // Source position in sprite sheet
            obstacle.width, obstacle.height,   // Source dimensions
            obstacle.x, obstacle.y,            // Destination position
            obstacle.width, obstacle.height    // Destination dimensions
        );
    });
}

// --- Health Bar Drawing ---
function drawHealthBar() {
    const barWidth = 150;
    const barHeight = 20;
    const x = 10;
    const y = 10;

    // Background (max health)
    ctx.fillStyle = '#555'; // Dark gray
    ctx.fillRect(x, y, barWidth, barHeight);

    // Foreground (current health)
    const currentHealthWidth = barWidth * (player.currentHealth / player.maxHealth);
    ctx.fillStyle = '#00FF00'; // Green
    // Clamp width to 0 if health is negative
    ctx.fillRect(x, y, Math.max(0, currentHealthWidth), barHeight);

    // Optional: Add border
    ctx.strokeStyle = '#000';
    ctx.strokeRect(x, y, barWidth, barHeight);
}

// Collision detection function (AABB)
function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}



// --- Updates ---
function updatePlayer() {
    // Apply horizontal movement based on keys pressed
    player.velocityX = 0; // Reset velocity each frame unless a key is pressed
    if (keysPressed.ArrowLeft) {
        player.velocityX = -player.speed;
        player.facingDirection = 'left';
    }
    if (keysPressed.ArrowRight) {
        player.velocityX = player.speed;
        player.facingDirection = 'right';
    }

    // Apply gravity
    player.velocityY += player.gravity;

    // Update position
    player.x += player.velocityX;
    player.y += player.velocityY;

    // Floor collision with ground level
    if (player.y > groundLevelY - player.height) {
        player.y = groundLevelY - player.height;
        player.velocityY = 0;
        player.isJumping = false;
    }

    // Basic boundary checks (optional, prevent going off-screen)
    if (player.x < 0) {
        player.x = 0;
    }
    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }

    // Update timers
    if (player.cooldownTimer > 0) {
        player.cooldownTimer--;
    }

    if (player.isAttacking) {
        player.attackTimer--;
        if (player.attackTimer <= 0) {
            player.isAttacking = false;
            // Reset justHit flag for all enemies when attack ends
            enemies.forEach(enemy => enemy.justHit = false);
        }
    }
    
    // Handle invincibility timer
    if (player.isInvincible) {
        player.invincibilityTimer--;
        if (player.invincibilityTimer <= 0) {
            player.isInvincible = false;
        }
    }
}
function updateEnemies() {
    enemies.forEach(enemy => {
        // Basic patrol movement
        enemy.x += enemy.speed * enemy.direction;

        // Check patrol boundaries
        if (enemy.direction === 1 && enemy.x + enemy.width > enemy.patrolRangeEnd) {
            enemy.direction = -1; // Change direction to left
            enemy.x = enemy.patrolRangeEnd - enemy.width; // Snap to boundary
        } else if (enemy.direction === -1 && enemy.x < enemy.patrolRangeStart) {
            enemy.direction = 1; // Change direction to right
            enemy.x = enemy.patrolRangeStart; // Snap to boundary
        }

        // Basic floor collision with ground level
        const floorY = groundLevelY - enemy.height;
        if (enemy.y < floorY) {
             // Apply gravity if needed in future
             // enemy.y += some_gravity_value;
        } else {
            enemy.y = floorY; // Ensure enemy stays on the floor
        }
    });

}
// Function to handle player attacks and enemy collisions
function handleAttacks() {
    if (!player.isAttacking) {
        // Reset justHit flag for all enemies *only* when attack *ends* (moved to updatePlayer)
        return; // Exit if player is not attacking
    }

    // Calculate the absolute position and dimensions of the attack box
    let attackHitbox = {
        x: 0,
        y: player.y + player.attackBox.offsetY,
        width: player.attackBox.width,
        height: player.attackBox.height
    };

    if (player.facingDirection === 'right') {
        attackHitbox.x = player.x + player.width + player.attackBox.offsetX;
    } else { // facing 'left'
        attackHitbox.x = player.x - player.attackBox.width - player.attackBox.offsetX;
    }

    // Check collision with each enemy
    enemies.forEach(enemy => {
        if (enemy.health > 0 && !enemy.justHit) { // Only check living, not-yet-hit enemies
            const enemyHitbox = {
                x: enemy.x,
                y: enemy.y,
                width: enemy.width,
                height: enemy.height
            };

            if (checkCollision(attackHitbox, enemyHitbox)) {
                enemy.health -= 1; // Decrease health
                enemy.justHit = true; // Mark as hit for this attack swing
                console.log('Enemy hit! Health:', enemy.health); // Optional: feedback
            }
        }
    });
}


// Function to handle collisions between player and enemies/obstacles
function handlePlayerCollisions() {
    // Check enemy collisions
    enemies.forEach(enemy => {
        // Check collision between player and enemy bounding boxes
        if (checkCollision(player, enemy) && !player.isInvincible) {
            // Damage implementation
            player.currentHealth -= 1;
            console.log("Player hit by enemy! Current Health:", player.currentHealth);

            // Set invincibility
            player.isInvincible = true;
            player.invincibilityTimer = player.invincibilityDuration;

            // Knockback effect
            player.velocityX = (player.x < enemy.x) ? -5 : 5; // Push away from enemy
            
            // Check for game over
            if (player.currentHealth <= 0) {
                player.currentHealth = 0;
                gameState = 'gameOver';
            }
        }
    });
    
    // Check obstacle collisions
    obstacles.forEach(obstacle => {
        if (checkCollision(player, obstacle)) {
            // For solid obstacles, prevent player from moving through them
            if (obstacle.solid) {
                // Simple collision resolution - push player out
                const overlapX = Math.min(
                    player.x + player.width - obstacle.x,
                    obstacle.x + obstacle.width - player.x
                );
                const overlapY = Math.min(
                    player.y + player.height - obstacle.y,
                    obstacle.y + obstacle.height - player.y
                );
                
                // Resolve collision in the direction of least overlap
                if (overlapX < overlapY) {
                    player.x += (player.x < obstacle.x) ? -overlapX : overlapX;
                } else {
                    player.y += (player.y < obstacle.y) ? -overlapY : overlapY;
                    // If landing on top, reset jump state
                    if (player.y < obstacle.y) {
                        player.velocityY = 0;
                        player.isJumping = false;
                    }
                }
            }
            
            // Damage logic for obstacles has been removed as per requirements
        }
    });
}

// Function to draw the game over screen
function drawGameOver() {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Game Over text
    ctx.fillStyle = 'red';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);
    
    // Instructions to restart
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 40);
}


// --- Event Listeners ---
function handleKeyDown(event) {
    // Handle game restart
    if (event.code === 'KeyR' && gameState === 'gameOver') {
        restartGame();
        return;
    }

    if (gameState !== 'playing') return; // Don't process other keys if game is over

    if (keysPressed.hasOwnProperty(event.key)) {
        keysPressed[event.key] = true;

        // Handle jump
        if ((event.key === 'ArrowUp' || event.key === ' ') && !player.isJumping) {
            player.velocityY = -12; // Adjust jump strength as needed
            player.isJumping = true;
            keysPressed[event.key] = false; // Treat jump as a single press
        } // End of jump block

        // Handle attack
        if (event.code === 'KeyZ' && !player.isAttacking && player.cooldownTimer <= 0) {
            player.isAttacking = true;
            player.attackTimer = player.attackDuration;
            player.cooldownTimer = player.attackCooldown;
            // We don't set keysPressed['KeyZ'] = false here,
            // as we might want attack variations based on hold later.
            // For now, the cooldown prevents immediate re-triggering.
        }
    }
}

// Function to restart the game
function restartGame() {
    // Reset player
    player.x = 50;
    player.y = groundLevelY - player.height;
    player.velocityX = 0;
    player.velocityY = 0;
    player.isJumping = false;
    player.isAttacking = false;
    player.attackTimer = 0;
    player.cooldownTimer = 0;
    player.currentHealth = player.maxHealth;
    player.isInvincible = false;
    player.invincibilityTimer = 0;

    // Reset enemies
    enemies = [];
    enemies.push(createEnemy(300, groundLevelY - enemyDefaults.height, 250, 450));
    enemies.push(createEnemy(600, groundLevelY - enemyDefaults.height, 550, 750));

    // Reset game state
    gameState = 'playing';
}

function handleKeyUp(event) {
    if (keysPressed.hasOwnProperty(event.key)) {
        keysPressed[event.key] = false;
    }
}

// Add event listeners
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

// Main game loop
function gameLoop() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    drawBackground();
    
    // Draw ground
    drawGround();

    // Update game objects if game is playing
    if (gameState === 'playing') {
        updatePlayer();
        updateEnemies();
        handleAttacks();
        handlePlayerCollisions();
    }

    // Draw game objects
    drawObstacles();
    drawPlayer();
    drawEnemies();
    
    // Draw attack box (for debugging or visual feedback)
    drawAttackBox();
    
    // Draw UI elements
    drawHealthBar();
    
    // Draw game over screen if game is over
    if (gameState === 'gameOver') {
        drawGameOver();
    }

    // Request next frame
    requestAnimationFrame(gameLoop);
}