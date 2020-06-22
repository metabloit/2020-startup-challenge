/**
 * This file contains the logic of the game for the startup challenge.
 *
 * @author    [Moses Minja] <[wmminja@gmail.com]>
 * @author    STEM Loyola <stemloyola@gmail.com>
 * @version   1.0
 *
 * @copyright STEM Loyola 2020.
 */

'use strict';

// Canvas position in the browser window. 
// You may need to adjust these if not displayed well in your computer
const WIDTH = window.innerWidth * 0.8;  // Canvas width will be 80% of the browser's width
const HEIGHT = window.innerHeight - 100;  // Canvas height will be 100 pixels less than the browser's height
const OFFSET = 130;  // Distance between the fighter's feet and the bottom of browser's window

// Control fighter's movements
const GRAVITY = 0.8;  // How quickly the fighter returns to the ground
const FIGHTER_DY = -20;  // How high the fighter will jump
const FIGHTER_DX = 3;  // How fast the fighter will walk

// Track game data
let fighter;  // A sprite storing the fighter details (e.g. position, speed, animations)
let coins;  // A group of sprite storing coins and their details
let monsters;  // A group of sprite storing monsters and their details
let walls;  // A group of sprite storing walls and their details
let gameEnd = false; // Checks if the game has ended or not
let animFighter;  // An array storing fighter's images used for animations
let animCoin;  // Coin animation images
let animMonster;  // Monster's animation images
let imgGround;  // A list of image used to build the ground
let imgBack;  // A list of images for the background background and its objects
let sounds; // An array for storing game sounds

// Speech control
let soundClassifier; // Variable for the sound input

/**
 * Executed once and loads resources into RAM before setup() is executed
 * Useful for loading images, sounds, etc. that usually are not loaded fast
 * enough for the performance needed in gaming and simulations.
 */
function preload() {


    // Load images for the background and its objects
    imgBack = {};
    imgBack['background'] = loadImage('assets/images/background.png');
    imgBack['bush'] = loadImage('assets/images/bush.png');
    imgBack['cactus'] = loadImage('assets/images/cactus.png');
    imgBack['skeleton'] = loadImage('assets/images/skeleton.png');
    imgBack['crate'] = loadImage('assets/images/crate.png');
    imgBack['coin'] = loadImage('assets/images/coin/coin-1.png');
    imgBack['mushroom'] = loadImage('assets/images/mushroom.png');

    // Load the ground images
    imgGround = {};
    imgGround['left'] = loadImage('assets/images/ground-left.png');
    imgGround['middle'] = loadImage('assets/images/ground-middle.png');

    // Load fighter animation images. Notice in loading an animation,
    // only the first and last images need to be specified
    animFighter = {};
    animFighter['idle'] = loadAnimation('assets/images/fighter/Idle-1.png', 'assets/images/fighter/Idle-10.png');
    animFighter['walk'] = loadAnimation('assets/images/fighter/Walk-1.png', 'assets/images/fighter/Walk-10.png');
    animFighter["jump"] = loadAnimation('assets/images/fighter/Jump-1.png', 'assets/images/fighter/Jump-10.png');

    // Load the game sounds
    soundFormats('mp3', 'ogg', 'wav');
    sounds = {};
    sounds['desert'] = loadSound('assets/sounds/desert/desert');
    sounds['walking'] = loadSound('assets/sounds/walking/walking');
    sounds['jump'] = loadSound('assets/sounds/jump/jump');
    sounds['coin'] = loadSound('assets/sounds/coin/coin');
    sounds['monster'] = loadSound('assets/sounds/monster/monster');
    sounds['gameOver'] = loadSound('assets/sounds/gameover/gameover2');
    sounds['gameOver'] = loadSound('assets/sounds/gameover/gameover');

    // Load coin animations
    animCoin = loadAnimation('assets/images/coin/coin-1.png', 'assets/images/coin/coin-16.png');

    // Load monster's animations
    animMonster = loadAnimation('assets/images/monster/monster-1.png', 'assets/images/monster/monster-19.png');

    // Threshold for the sound's accuracy
    const options = {probabilityThreshold: 0.8};
    soundClassifier = ml5.soundClassifier('SpeechCommands18w', options);

}

/**
 * Executed once and initializes the canvas and other data.
 * Everything that should be done once and at the beginning of the app
 * (e.g. loading images, sounds) should be done in this function.
 */
function setup() {

    /*
     * Setup the canvas
     */

    // Append a canvas into the website page (inside 'demo-container')
    let canvas = createCanvas(WIDTH, HEIGHT);
    canvas.parent('demo-container');

    sounds['desert'].play();
    sounds['desert'].loop();

    /*
     Coin walls
     */
    walls = new Group();

    // The wall above
    let w1 = createSprite(0, -20, WIDTH * 10, 0);
    walls.add(w1);
    // The wall below
    let w2 = createSprite(0, HEIGHT / 2, WIDTH * 10, 0);
    walls.add(w2);

    // Make sure the walls not move from their positions
    for (let i = 0; i < walls.length; i++) {
        walls[i].immovable = true;
    }

    /*
     * Build the fighter character
     */

    fighter = createSprite(80, HEIGHT - OFFSET);

    // Add all animations the fighter uses
    fighter.addAnimation('idling', animFighter['idle']);
    fighter.addAnimation('walking', animFighter['walk']);
    fighter.addAnimation('jumping', animFighter['jump']);

    // Reduce the size of the fighter to appear nicer on the screen
    fighter.scale = 0.25;

    // Set the fighter's collision boundary
    fighter.setCollider('circle', 0, 0, fighter.width / 2);

    // Define our own variable to track the state of the fighter
    fighter.isJumping = false;
    fighter.dy = FIGHTER_DY;
    fighter.score = 0;


    /*
     * Build the coins
     */
    coins = new Group();

    // Test coin
    // Two coins stacked up on top of the other
    for (let i = 1; i <= 3; i++) {
        for (let j = 3; j <= 5; j++) {
            let coin = createSprite(WIDTH * i, j * 50);
            coin.addAnimation('spin', animCoin);
            coin.scale = 0.4;
            coin.dy = -0.7;
            coin.MAX_HEIGHT = HEIGHT / 2;
            coins.add(coin);
        }
    }

    // One coin stacked up on top of the other
    for (let i = 1; i <= 4; i++) {
        for (let j = 3; j <= 4; j++) {
            let coin;
            if (i < 4) {
                coin = createSprite(WIDTH * i + 400, j * 55);
            } else if (i === 4) {
                coin = createSprite(WIDTH * i, j * 55);
            }
            coin.addAnimation('spin', animCoin);
            coin.scale = 0.4;
            coin.dy = -0.2;
            coin.MAX_HEIGHT = HEIGHT / 2;
            coins.add(coin);
        }
    }

    // For the coin that moves up and down and rotate
    for (let i = 1; i <= 3; i++) {
        let coin;
        if (i < 3) {
            coin = createSprite(WIDTH * i + 750, i * 25);
        } else if (i === 3) {
            coin = createSprite(WIDTH * i + 720, i * 25);
        }
        coin.addAnimation('spin', animCoin);
        coin.scale = 0.4;
        coin.dy = -0.7;
        coin.MAX_HEIGHT = HEIGHT / 2;
        coin.setSpeed(-2, 90);
        coins.add(coin);
    }

    /*
     * Build the monsters
     */
    monsters = new Group();

    // Test monsters
    for (let i = 1; i <= 3; i++) {
        let monster = createSprite(WIDTH * i * random(3, 3.5), HEIGHT - OFFSET + 45);
        monster.addAnimation('walk', animMonster);
        monster.scale = 0.35;
        monster.setVelocity(-5, 0);
        monster.setCollider('circle', 0, 0, monster.width / 7);
        monsters.add(monster);
    }

    // Handles the results of classification
    soundClassifier.classify(gotCommand);

}

/**
 * Runs continuously after setup() and updates the state of the application.
 * Everything that should continuously be checked, updated, and done should
 * be done from function
 */
function draw() {

    // Coin to be removed from sketch when the fighter collides with it
    fighter.collide(coins, removeCoin);

    // Up and down movement of the coins limited by two walls
    coins.bounce(walls);

    /*
     * Update the game elements that depend on user input
     */

    // Respond to pressed/released keys if the fighter is NOT currently jumping
    if (fighter.isJumping === false) {

        // Pressing the right arrow moves the fighter forwards
        if (keyWentDown(RIGHT_ARROW)) {
            fighter.changeAnimation('walking');
            fighter.setVelocity(FIGHTER_DX, 0);
            sounds['walking'].play(); // Walking sound plays
            sounds['walking'].loop(); // Walking sound loops
        }

        // Releasing the right arrow stops the fighter
        if (keyWentUp(RIGHT_ARROW)) {
            fighter.changeAnimation('idling');
            fighter.setVelocity(0, 0);
            sounds['walking'].stop(); // Walking sound stops
            sounds['jump'].stop(); // Jumping sound stops
        }

        // Pressing the up arrow starts the fighter's jump
        if (keyWentDown(UP_ARROW)) {
            fighter.isJumping = true;
            fighter.changeAnimation('jumping');
            fighter.setVelocity(0, 0);
            sounds['jump'].play(); // Jumping soun plays
            sounds['walking'].stop(); // Walking sound stops
        }

    } else { // Fighter is currently jumping

        // Calculate the new position. The new position is affected by
        // fighter's current vertical speed. The current vertical speed
        // is affected by the vertical acceleration (a.k.a gravity)
        fighter.dy += GRAVITY;
        fighter.position.y += fighter.dy;

        fighter.position.y = constrain(fighter.position.y, 0, HEIGHT - OFFSET);

        // End the jump when the fighter returns to the ground
        if (fighter.position.y === HEIGHT - OFFSET) {
            fighter.isJumping = false;  // Mark the jump as finished
            fighter.dy = FIGHTER_DY;  // Reset initial vertical speed for the next jump

            // Fighter should now rest on the ground
            fighter.changeAnimation('idling');
        }
    }

    // Center the fighter on the screen for sometime
    if (fighter.position.x > WIDTH / 2 && fighter.position.x < WIDTH * 4) {
        camera.position.x = fighter.position.x;
    }

    /*
     * Display the game elements based on the canvas
     */

    // Display the background and its objects
    background(imgBack['background']);

    // Objects to appear at various positions
    for (let i = 1; i < 10; i++) {
        image(imgBack['skeleton'], WIDTH * 0.4 * i * i * i, HEIGHT - OFFSET + 45);
        image(imgBack['bush'], WIDTH * 0.8 * i + 100, HEIGHT - OFFSET);
        image(imgBack['crate'], WIDTH * 0.4 * i * i * i + 120, HEIGHT - OFFSET + 15, 60, 60);
        image(imgBack['mushroom'], WIDTH * 1.6 + 10, HEIGHT - OFFSET + 55, 20, 20);
        image(imgBack['cactus'], WIDTH * 1.6 * i, HEIGHT - OFFSET - 35);
        image(imgBack['mushroom'], WIDTH * 1.6 + 75, HEIGHT - OFFSET + 55, 20, 20);
    }
    // Display the ground
    image(imgGround['left'], 10, HEIGHT - OFFSET + 75);

    for (let i = 1; i < 20 * WIDTH / imgGround['middle'].width; i++) {
        image(imgGround['middle'], imgGround['middle'].width * i + 10, HEIGHT - OFFSET + 75);
    }

    // Checks if the fighter has collected all the coins or if the monster
    // has bitten the fighter, if true, game is over
    if (camera.position.x < fighter.position.x - 500 || fighter.score === 20) {
        gameEnd = true;
        gameOver();
        noLoop();
    }
    if (fighter.collide(monsters)) {
        gameEnd = true;
        sounds['monster'].play(); // Monster bite sound
        gameOver();
        noLoop();
    }

    // Display all the sprites (e.g. fighter, monsters, coins)
    drawSprites();

    // Displays the score
    displayScore();
}

function displayScore() {

    // Display the player's score
    image(imgBack['coin'], camera.position.x - WIDTH / 2.1, 20, 35, 35);
    fill(255, 0, 0);
    textSize(22);
    textAlign(LEFT);
    text(fighter.score * 1000, camera.position.x - WIDTH / 2.1 + 45, 45);

}

/*
    Callback functions for the collisions
*/
function removeCoin(fighter, coin) {

    // Sounds
    sounds['coin'].play(); // The coin sound
    sounds['walking'].stop(); // Walking sound

    // Remove the coin from the sketch
    coin.remove();

    // Increase the fighter's score
    fighter.score++;
}

/*
    Ends the game when conditions are met
*/
function gameOver() {

    //Removes the fighter, monster and coin respectively from the sketch when this function is called
    fighter.remove();
    coins.removeSprites();
    monsters.removeSprites();

    // Stop other sounds
    sounds['walking'].stop();
    sounds['desert'].stop();
    sounds['jump'].stop();
    sounds['gameOver'].play();

    /* TEXT PROPERTIES */
    fill(255, 0, 0); // The text's color
    textSize(50); // Text's font size
    textAlign(CENTER, CENTER); //Aligns the text at the centre
    text('GAME OVER! ', camera.position.x, HEIGHT / 2); // Position of the text on the screen
    fill(255, 0, 0); // The text's color
    textSize(30); // Text's font size
    textAlign(CENTER, CENTER); //Aligns the text at the centre
    text('YOUR SCORE: ' + fighter.score * 1000, camera.position.x, HEIGHT / 2 + 50);// Position of the text on the screen
}

// Controls fighter's movements using speech control
function gotCommand(error, results) {
    if (error) {
        console.log(error);
    }

    // console.log(results[0].label, results[0].confidence);

    // If the game ends, speech input should end as well
    if (gameEnd === false) {

        // If input command is 'up' then fighter jumps
        if (results[0].label === 'up') {
            fighter.isJumping = true;
            fighter.changeAnimation('jumping');
            fighter.setVelocity(0, 0);
            sounds['walking'].stop();
            sounds['jump'].play();
        }

        // If input command is 'right' then fighter goes right
        if (results[0].label === 'right') {
            fighter.changeAnimation('walking');
            fighter.setVelocity(FIGHTER_DX, 0);
            sounds['jump'].stop();
            sounds['walking'].play();
            sounds['walking'].loop();
        }

        // If input command is 'stop' then fighter becomes idle
        if (results[0].label === 'stop') {
            fighter.changeAnimation('idling');
            fighter.setVelocity(0, 0);
            sounds['walking'].stop();
        }
    }
}

/*
    Play the game on a touch screen device(such as a tablet)
*/

let value = 0; // Tracks how many times the screen is touched

function touchStarted() {

    if (gameEnd === false) { // The touch should end when the game is over

        /* Makes sure the touch event is done only when the fighter
           is on the ground */
        if (fighter.position.y === HEIGHT - OFFSET) {

            value = value + 1; // Increments by one if the screen is touched

            /* If the screen is touched twice or touched when the fighter is walking
             then the fighter should jump
             */
            if (value === 2) {
                fighter.isJumping = true;
                fighter.changeAnimation('jumping');
                fighter.setVelocity(0, 0);
                sounds['walking'].stop();
                sounds['jump'].play();
                value = 0;
            }

            /* If the screen is touched once then the fighter should only walk */
            else if (value === 1) {
                fighter.changeAnimation('walking');
                fighter.setVelocity(FIGHTER_DX, 0);
                sounds['walking'].play();
                sounds['walking'].loop();
            }

            // Makes sure the touch ranges between one and two touches
            if (value > 2) {
                value = 0;
            }
        }
    }
}