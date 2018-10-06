window.onload = function() {

    // ------ Variables To Play With ------ \\
    var bird_size = 50,
        view_hitbox = true, //Set this to true if you want to see the hitbox of the bird
        bird_x_start = 50,
        bird_y_start = 100,
        wall_width = 65,
        new_wall_point = 500,
        wallspeed_acceleration = 0.001,
        gravity_acceleration = 0.1,
        opacity_acceleration = 0.025,
        jump_velocity = -3.5,
        max_velocity = 5,
        colors = ['#87000E', '#159B00', '#717D7E', '#1F618D', '#D35400', '#8E44AD', '#E000F3', '#1ABC9C'];

    //Boring variables
    var canvas = document.getElementById('gamearea'),
        ctx = canvas.getContext('2d'),
        background = document.getElementById('background'),
        walls = [];
    //Check for highscores on the browser
    var highscore;
    if (localStorage.highscore) {
        highscore = localStorage.getItem("highscore");
    } else {
        highscore = 0;
    }
    //Boolean variables
    var buildWall = true,
        collision = false,
        timeUpdate = true,
        falling = false,
        pointsPossible = true,
        newHighScore = false;
    //Constantly changing values
    var wallSpeed = 1.5,
        colorIndex = 0,
        birdVelocity = 0,
        opacity = 1.0,
        points = 0,
        fadeIn = 0,
        time = 0;
    //Interval placeholders
    var start_screen,
        game_screen,
        loss_screen;
    //Objects - Some rectangles for start and loss screens
    const middleRect = new Wall(100, 500 , 600, 300, '#D35400'),
          lossButton = new Wall(300, 300, 200, 75, 'Black'),
          pointsBox = new Wall(595, 0, 205, 40, 'Black');
    //The array of 12 rectangles that make up my bird
    var birdImages = [
        new BirdRect(0, 16, 4, 16, document.getElementById("0")),
        new BirdRect(4, 12, 12, 20, document.getElementById("1")),
        new BirdRect(8, 8, 4, 4, document.getElementById("2")),
        new BirdRect(12, 4, 36, 36, document.getElementById("3")),
        new BirdRect(20, 0, 24, 4, document.getElementById("4")),
        new BirdRect(16, 40, 44, 4, document.getElementById("5")),
        new BirdRect(24, 44, 20, 4, document.getElementById("6")),
        new BirdRect(48, 8, 4, 16, document.getElementById("7")),
        new BirdRect(52, 12, 4, 12, document.getElementById("8")),
        new BirdRect(48, 24, 12, 16, document.getElementById("9")),
        new BirdRect(60, 28, 4, 4, document.getElementById("10")),
        new BirdRect(4, 32, 8, 4, document.getElementById("11"))
    ];
    //I set up the bird at 0, 0 so I need to adjust my values for starting position
    for (var i = 0; i < 12; i++) {
        birdImages[i].x += bird_x_start;
        birdImages[i].y += bird_y_start;
    }

    //--------------------------------------Begining of Game Logic--------------------------------------\\

    //Run Start screen
    start_screen = setInterval(startLoop, 10);

    //This function draws the start screen and waits for the user to start the game
    function startLoop() {
        //Listen for spacebar to start game
        document.body.onkeyup = function(e) {
            if (e.which === 32) {
                clearInterval(start_screen);
                game_screen = setInterval(gameLoop, 10);
            }
        }

        drawStart();
    }

    //This function does all of the calcutaions for the bird/walls and calls the drawGame function
    function gameLoop() {
        //Update time for game timer
        if (timeUpdate === true) {
            time += 1;
        }

        //Listen for jump command
        document.body.onkeyup = function(e) {
            if (e.which === 32 && !falling) {
                birdVelocity = jump_velocity;
            }
        }

        //Construct a bottom/top pair of walls, add them to wall array
        if (buildWall) {
            var bottomHeight = Math.round(Math.random() * (300 - 150) + 100),
                bottomOffsetHeight = 500 - bottomHeight,
                topHeight = 500 - (bottomHeight + 150);
            const bottomWall = new Wall(790, bottomOffsetHeight, wall_width, bottomHeight, getColor()),
                  topWall = new Wall(790, 0, wall_width, topHeight, bottomWall.color);

            walls.push(topWall);
            walls.push(bottomWall);
            buildWall = false;
        }

        // I have to check collision for every rectangle of the bird
        for (var i = 0; i < 12; i++) {
            var bird = birdImages[i],
                topWall = walls[0],
                bottomWall = walls[1];

            if ((bird.x < bottomWall.x + bottomWall.width &&
                bird.x + bird.width > bottomWall.x &&
                bird.y < bottomWall.y + bottomWall.height &&
                bird.y + bird.height > bottomWall.y) ||
               (bird.x < topWall.x + topWall.width &&
                bird.x + bird.width > topWall.x &&
                bird.y < topWall.y + topWall.height &&
                bird.y + bird.height > topWall.y)) {
                    collision = true;
            }
        }

        //Check for collision with ceiling/floor. 6 and 4 are my top and bottom rectangles of the bird
        if (birdImages[4].y < 0 || birdImages[6].y + 4 >= canvas.height) {
            collision = true;
        }

        //Check points algorithm. birdImages[0] is teh left most rectangle of the bird
        if (birdImages[0].x >= walls[0].x + wall_width) {
            if (pointsPossible === true) {
                points += 1;
            }
            pointsPossible = false;
        }

        //Checks to see if new wall should be built yet
        if (walls[walls.length - 1].x <= new_wall_point) {
            buildWall = true;
        }

        //Delete walls from wall array when offscreen past bird
        if (walls[0].x <= (-1 * wall_width) + 1) {
            walls.shift();
            walls.shift();
            pointsPossible = true;
        }

        //If collision, stop walls and make the player fall. Stop updating time
        if (collision) {
            wallSpeed = 0;
            falling = true;
            timeUpdate = false;
        }

        //Death sequence - fade out background when bird off screen
        if (falling && opacity >= 0 && bird.y >= 500) {
            opacity -= opacity_acceleration;
        }

        //If opacity is 0, the bird is off the screen so its ok to switch over to my loss loop
        if (falling && opacity <= 0.0)  {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            clearInterval(game_screen);
            checkScore();
            loss_screen = setInterval(drawLoss, 10);
        }

        //Call the function to draw everything happening in the game loop
        drawGame();

        //Updates values for gravity, wallspeed, and bird y coordinate
        if (birdVelocity + gravity_acceleration < max_velocity) {
            birdVelocity += gravity_acceleration;
        }
        wallSpeed += wallspeed_acceleration;
        for (var i = 0; i < 12; i++) {
            var bird = birdImages[i];
            bird.y += birdVelocity;
        }
    }

    //Draws rectangles and text for start screen
    function drawStart() {
        ctx.beginPath();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = middleRect.color;
        ctx.fillRect(100, 100, 600, 300);
        ctx.textAlign = 'center';
        ctx.font = '60px Magneto';
        ctx.fillStyle = '#1ABC9C';
        ctx.fillText("Flying Bird", canvas.width / 2, 70);
        ctx.font = "40px Calibri";
        ctx.fillText("Press SPACEBAR to Start!", canvas.width / 2, 450);
        ctx.fillStyle = "black";
        ctx.fillText("Welcome!", canvas.width / 2, 150);
        ctx.fillText("The goal of this game is to", canvas.width / 2, 210);
        ctx.fillText("fly for as long as possible", canvas.width / 2, 250);
        ctx.fillText("Controls:", canvas.width / 2, 310);
        ctx.fillText("Press SPACEBAR to jump", canvas.width / 2, 360);
        ctx.closePath();
    }

    //Draws walls, bird, time, and points
    function drawGame() {
        ctx.beginPath();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = "start";
        ctx.globalAlpha = opacity;
        ctx.save();

        //Moves the walls over by wallSpeed each iteration - this speeds up with wallspeed_acceleration
        for (var i = 0; i < walls.length; i++) {
            ctx.fillStyle = walls[i].color;
            ctx.fillRect(walls[i].x, walls[i].y, walls[i].width, walls[i].height);
            ctx.strokeRect(walls[i].x, walls[i].y, walls[i].width, walls[i].height);
            walls[i].x -= wallSpeed;
        }

        //Rotates bird based on its velocity (turn up if going up, turn down if going down)
        /*var angle = 0;
        if (birdVelocity >= 3.5) {
            angle = Math.PI / 3;
            ctx.translate(bird.x + 30, bird.y - 5);
        } else if (birdVelocity > 2 && birdVelocity < 3.5) {
            angle = Math.PI / 6;
            ctx.translate(bird.x + 20, bird.y - 5);
        } else if (birdVelocity <= 2 && birdVelocity >= -1.5) {
            //No angle rotation, looking forward 0 degrees
            ctx.translate(bird.x, bird.y);
        } else if (birdVelocity > -1.5 && birdVelocity <= 0) {
            angle = Math.PI / -3;
            ctx.translate(bird.x - 50, bird.y);
        } else if (birdVelocity >= -3.5 && birdVelocity <= -1.5) {
            angle = Math.PI / -6;
            ctx.translate(bird.x - 15, bird.y + 20);
        }
        ctx.rotate(angle);*/

        for (var i = 0; i < 12; i++) {
            var bird = birdImages[i];
            ctx.strokeStyle = "red";
            ctx.strokeRect(bird.x, bird.y, bird.width, bird.height);
            ctx.drawImage(bird.image, bird.x, bird.y, bird.width, bird.height);
        }

        //Resets canvas location from translates/rotation and draws rects/text for points/time
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = pointsBox.color;
        ctx.fillRect(pointsBox.x, pointsBox.y, pointsBox.width, pointsBox.height);
        ctx.fillStyle = "White";
        ctx.strokeStyle = 'White';
        ctx.strokeRect(pointsBox.x + 5, pointsBox.y + 5, pointsBox.width - 12, pointsBox.height - 12);
        ctx.font = "20px Calibri";
        ctx.fillText(`Points: ${points}`, 710, 25);
        ctx.fillText(`Time: ${time / 100}`, 610, 25);
        ctx.restore();
        ctx.closePath();
    }

    //Draws text and shapes on loss screen
    function drawLoss() {
        ctx.beginPath();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
        ctx.textAlign = 'center';
        ctx.font = '60px Magneto';
        ctx.fillStyle = '#1ABC9C';
        ctx.fillText("Flying Bird", canvas.width / 2, 70);
        ctx.fillStyle = middleRect.color;
        ctx.fillRect(middleRect.x, middleRect.y, middleRect.width, middleRect.height);
        if (middleRect.y > 100) {
            middleRect.y -= 5;
        } else {
            ctx.globalAlpha = fadeIn;
            ctx.fillStyle = "Black";
            ctx.font = '60px Calibri'
            ctx.fillText("Good Try!", canvas.width / 2, 175);
            ctx.font = '40px Calibri';
            ctx.fillText(`Points: ${points}`, canvas.width / 2, 235);
            ctx.fillText(`Time: ${time / 100} seconds`, canvas.width / 2, 270);

            if (fadeIn < 1) {
                fadeIn += opacity_acceleration;
            } else {
                ctx.fillStyle = lossButton.color;
                ctx.fillRect(lossButton.x, lossButton.y, lossButton.width, lossButton.height);
                ctx.font = '20px Calibri';
                ctx.fillStyle = "White";
                ctx.fillText("Press F5 to Restart", canvas.width / 2, 345);
                ctx.fillStyle = 'Black';
                ctx.font = '15px Calibri';
                ctx.fillText('Created by: Kevin Meyer', canvas.width / 2, 490);

                ctx.font = "30px Calibri";
                if (newHighScore === true) {
                    ctx.fillText("New High Score!", canvas.width / 2, 430);
                }
                ctx.fillText(`Highscore: ${localStorage.highscore}`, canvas.width / 2, 460);
                clearInterval(loss_screen);
            }
            ctx.fill();
        }
        ctx.closePath();
    }

    //Function returns a color, come out in sequential order
    function getColor() {
        var color = colors[colorIndex];
        colorIndex++;

        if (colorIndex == colors.length) {
            colorIndex = 0;
        }
        return color;
    }

    //Compares points after game is over to saved highscore
    function checkScore() {
        if (points > highscore) {
            localStorage.setItem("highscore", points);
            newHighScore = true;
        }
    }
}

//This is the class for the Walls
class Wall {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    get x() {
        return this._x;
    }

    get y() {
        return this._y
    }

    get height() {
        return this._height;
    }

    get width() {
        return this._width;
    }

    get color() {
        return this._color;
    }

    set x(x) {
        this._x = x;
    }

    set y(y) {
        this._y = y;
    }

    set height(height) {
        this._height = height;
    }

    set width(width) {
        this._width = width;
    }

    set color(color) {
        this._color = color;
    }
}

//This is the class for the Bird
class BirdRect {
    constructor(x, y, width, height, image) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.image = image;
    }

    get x() {
        return this._x;
    }

    get y() {
        return this._y;
    }

    get height() {
        return this._height;
    }

    get width() {
        return this._width;
    }

    get image() {
        return this._image;
    }

    set x(x) {
        this._x = x;
    }

    set y(y) {
        this._y = y;
    }

    set width(width) {
        this._width = width;
    }

    set height(height) {
        this._height = height;
    }

    set image(image) {
        this._image = image;
    }
}
