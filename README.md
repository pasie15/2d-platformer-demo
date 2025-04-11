# 2D Platformer Demo

A simple 2D platformer game demo built with HTML5 Canvas, CSS, and JavaScript.

![Game Screenshot](platformer-character-demo.png)

## Description

This is a basic 2D platformer game demo that features:

- Player character with movement, jumping, and attack abilities
- Enemy characters that patrol within defined areas
- Various obstacles (spikes, crates, stones)
- Health system and game over state
- Sprite-based graphics

## How to Play

1. Open `index.html` in a web browser
2. Use the following controls:
   - **Arrow Left/Right**: Move the player character
   - **Arrow Up** or **Space**: Jump
   - **Z key**: Attack enemies
   - **R key**: Restart the game after game over

## Game Features

- **Player Character**: A warrior that can move, jump, and attack enemies
- **Enemies**: Patrol within defined ranges and damage the player on contact
- **Obstacles**: Various obstacles that the player can interact with
- **Health System**: Player has a health bar that decreases when hit by enemies
- **Game Over**: When player health reaches zero, the game ends with an option to restart

## Files

- `index.html`: Main HTML file
- `style.css`: CSS styling for the game canvas
- `script.js`: Game logic and mechanics
- Image assets:
  - `warrior.png`: Player character sprite
  - `enemy.png`: Enemy character sprite
  - `obstacles.png`: Sprite sheet for various obstacles
  - `ground_texture.png`: Ground texture
  - `sky_background.png`: Background image

## Development

This game is built using vanilla JavaScript and HTML5 Canvas. It demonstrates basic game development concepts such as:

- Game loop implementation
- Sprite rendering
- Collision detection
- Input handling
- Game state management

## License

This project is open source and available for educational purposes.