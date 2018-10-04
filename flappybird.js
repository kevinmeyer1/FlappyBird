window.onload = function() {
    // ------ Variables To Play With ------ \\
    var bird_size = 50;
    var view_hitbox = false; //Set this to true if you want to see actual hitbox of the bird
    var bird_x_start = 50;
    var bird_y_start = 100;
    var wall_width = 65;
    var new_wall_point = 500;
    var wallSpeed = 1.5;
    var wallspeed_acceleration = 0.001;
    var gravity_acceleration = 0.1;
    var opacity_acceleration = 0.025;
    var jump_velocity = -3.5;
    var max_velocity = 5;
    var colors = ['#87000E', '#159B00', '#717D7E', '#1F618D', '#D35400', '#8E44AD', '#E000F3', '#1ABC9C'];

    //Boring variables
    var canvas = document.getElementById('gamearea');
    var ctx = canvas.getContext('2d');
    var walls = [];
    //check and see if a highscore already exists on this browser
    var highscore;
    if (localStorage.highscore) {
        highscore = localStorage.getItem("highscore");
    } else {
        highscore = 0;
    }
    var birdImage = document.getElementById('bird');
    var buildWall = true, birdExists = false, collision = false, timeUpdate = true;
    var falling = false, pointsPossible = true, askedForName = false, newHighScore = false;
    var colorIndex = 0, bird_velocity = 0, opacity = 1.0;
    var points = 0, fade_in = 0, time = 0;
    var canvas_height = 500, canvas_width = 800;
    var loss_screen, gameloop;
    const lossRect = new Wall(100, 500 , 600, 300, '#D35400');
    const lossButton = new Wall(300, 300, 200, 75, 'Black');
    const pointsBox = new Wall(595, 0, 205, 40, 'Black');

    //Create bird and start game loop
    var bird = new Bird(bird_x_start, bird_y_start, bird_size, bird_size);
    gameRunning = setInterval(gameloop, 10);

    //Main game loop running every 10 ms
    function gameloop() {
        //Update time for game timer
        if (timeUpdate === true) {
            time += 1;
        }

        //Listen for jump command
        document.body.onkeyup = function(e) {
            if (e.which === 32 && !falling) {
                bird_velocity = jump_velocity;
            }
        }

        //Construct a bottom/top pair of walls, add them to wall array
        if (buildWall) {
            var bottomHeight = Math.round(Math.random() * (300 - 150) + 100);
            var bottomOffsetHeight = 500 - bottomHeight;
            var topHeight = 500 - (bottomHeight + 150);
            const bottomWall = new Wall(790, bottomOffsetHeight, wall_width, bottomHeight, getColor());
            const topWall = new Wall(790, 0, wall_width, topHeight, bottomWall.color);

            walls.push(topWall);
            walls.push(bottomWall);
            buildWall = false;
        }

        //Check for collision with walls
        for (var i = 0; i < walls.length; i++) {
            var wall = walls[i];
            if (wall.x < wall.x + wall.width &&
                bird.x + bird.width > wall.x &&
                bird.y < wall.y + wall.height &&
                bird.y + bird.height > wall.y) {
                    collision = true;
                }
        }

        //Check for collision with ceiling/floor
        if (bird.y >= 425 || bird.y <= 0) {
            collision = true;
        }

        //Check points algorithm
        if (bird.x >= walls[0].x + wall_width) {
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
            ctx.clearRect(0, 0, canvas_width, canvas_height);
            clearInterval(gameRunning);
            checkScore();
            loss_screen = setInterval(drawLoss, 10);
        }

        //Call the function to draw everything happening in the game loop
        drawGame();

        //update values for gravity, wallspeed, and bird y coordinate
        if (bird_velocity + gravity_acceleration < max_velocity) {
            bird_velocity += gravity_acceleration;
        }
        wallSpeed += wallspeed_acceleration;
        bird.y += bird_velocity;
    }

    //Draws walls, bird, time, and points every run through
    function drawGame() {
        ctx.beginPath();
        ctx.clearRect(0, 0, canvas_width, canvas_height);
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
        var angle = 0;
        if (bird_velocity >= 3.5) {
            angle = Math.PI / 3;
            ctx.translate(bird.x + 25, bird.y);
        } else if (bird_velocity > 2 && bird_velocity < 3.5) {
            angle = Math.PI / 6;
            ctx.translate(bird.x + 20, bird.y);
        } else if (bird_velocity <= 2 && bird_velocity >= -1.5) {
            //No angle rotation, moving forward
            ctx.translate(bird.x, bird.y);
        } else if (bird_velocity > -1.5 && bird_velocity <= 0) {
            angle = Math.PI / -3;
            ctx.translate(bird.x - 50, bird.y);
        } else if (bird_velocity >= -3.5 && bird_velocity <= -1.5) {
            angle = Math.PI / -6;
            ctx.translate(bird.x - 15, bird.y + 20);
        }
        ctx.rotate(angle);
        ctx.drawImage(birdImage, 0, 0, bird_size, bird_size);

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
        ctx.fill();
        ctx.restore();
        if (view_hitbox === true) {
            ctx.strokeRect(bird.x, bird.y, bird_size, bird_size);
        }
        ctx.closePath();
    }

    //Draws text and shapes on loss screen
    function drawLoss() {
        ctx.beginPath();
        ctx.clearRect(0, 0, canvas_width, canvas_height);
        ctx.globalAlpha = 1;
        ctx.fillStyle = lossRect.color;
        ctx.fillRect(lossRect.x, lossRect.y, lossRect.width, lossRect.height, lossRect.color);
        if (lossRect.y > 100) {
            lossRect.y -= 5;
        } else {
            ctx.globalAlpha = 1;
            ctx.textAlign = 'center';
            ctx.font = '60px Magneto';
            ctx.fillStyle = '#1ABC9C';
            ctx.fillText("Flying Bird", canvas.width / 2, 70);
            ctx.globalAlpha = fade_in;
            ctx.fillStyle = "Black";
            ctx.font = '60px Calibri'
            ctx.fillText("Good Try!", canvas.width / 2, 175);
            ctx.font = '40px Calibri';
            ctx.fillText(`Points: ${points}`, canvas.width / 2, 235);
            ctx.fillText(`Time: ${time / 100} seconds`, canvas.width / 2, 270);

            if (fade_in < 1) {
                fade_in += opacity_acceleration;
            }

            if (fade_in >= 1) {
                ctx.fillRect(lossButton.x, lossButton.y, lossButton.width, lossButton.height, lossButton.color);
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
class Bird {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
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
}
