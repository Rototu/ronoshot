const GameModule = (function () {
  ('use strict');

  const canv = document.getElementById('canv');

  class CanvasModule {
    constructor(canvas) {
      this.canvas = canvas;
      this.context = canvas.getContext('2d');
      this.canvasOverlay = document.getElementById("canvas-overlay");
      this.booleans = {
        isLeftArrowPressed: false,
        isRightArrowPressed: false,
        isSpaceKeyPressed: false,
        isShootingEnabled: false,
        isLevelStarted: false,
        areControlsEnabled: false,
        hasGameEnded: false
      };
      this.playerLifes = {
        count: 4,
        imageSrc: 'img/rono.png'
      };
      this.player = {
        imageSrc: 'img/ronoUfo.png',
        width: 50,
        height: 50,
        xPos: canvas.width / 2 - 50 / 2,
        yPos: canvas.height - 50 / 2 - 50,
        speed: 20,
        isVulnerable: true
      }; // center player on canvas x-Axis and set yPos
      this.shots = [];
      this.enemyShots = [];
      this.enemies = [];
      this.backgroundNearY = 0;
      this.backgroundNear = {};
      this.backgroundMiddleY = 0;
      this.backgroundMiddle = {};
      this.backgroundFarY = 0;
      this.backgroundFar = {};
      this.initialTimeStamp = null;
      this.firstShotFrameNumber = null;
      this.frameCount = 0;
      this.openBracketShot = false;
      this.level = 0;
    }

    randX() {
      const canvasWidth = this.canvas.width;
      return Math.floor(Math.random() * canvasWidth);
    }
    randY() {
      const canvasHeight = this.canvas.height;
      return Math.floor(Math.random() * canvasHeight);
    }
    randRad(size) {
      return Math.floor(Math.random() * size) + 1; // minimum Radius = 1px, maximum 1+size
    }

    initializeModule() {
      this.addEventListeners(); // intialize controls
      this.initializeStarryBackground(0.4, 'backgroundFar'); // draw background and store it for further use
      this.initializeStarryBackground(1, 'backgroundMiddle');
      this.initializeStarryBackground(1.2, 'backgroundNear');
      this.initializeCustomCanvasFunctions(); // set custom canvas context prototype functions
      this.getImageFile(this.player.imageSrc, 49, 100, this.player); // load player icon
      this.getImageFile(this.playerLifes.imageSrc, 32, 32, this.playerLifes); // load lifes icon
      this.centerObjectHorizontallyOnCanvas(this.player, this.canvas); // center player on screen
      this.context.font = '30px arial'; // set canvas font Style
      this.loadNextLevel();
      this.requestAnimationFrame(this.drawAnimationFrame); // start animation
    }

    initializeCustomCanvasFunctions() {
      // copied from
      // http://js-bits.blogspot.ro/2010/07/canvas-rounded-corner-rectangles.html
      // purpose: drawing rectangles with rounded corners
      CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius, fill, stroke) {
        if (typeof stroke == 'undefined') {
          stroke = true;
        }
        if (typeof radius === 'undefined') {
          radius = 5;
        }
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
        if (stroke) {
          this.stroke();
        }
        if (fill) {
          this.fill();
        }
      };
    }

    initializeStarryBackground(starRadius, backgroundStorageObject) {
      const context = this.context;
      const {width: canvasWidth, height: canvasHeight} = this.canvas;
      context.beginPath();
      context.rect(0, 0, canvasWidth, canvasHeight);
      context.closePath();
      context.fillStyle = 'black';
      context.fill();
      let x,
        y,
        r;
      for (let i = 1; i <= 200; i++) {
        // create star
        x = this.randX();
        y = this.randY();
        r = this.randRad(starRadius);
        const star = context.createRadialGradient(x, y, 0, x, y, r);
        star.addColorStop(0, 'rgba(255,255,255,1)');
        star.addColorStop(0.8, 'rgba(255,255,255,0.8)');
        star.addColorStop(1, 'rgba(228,0,0,0)');

        // draw shape
        context.fillStyle = star;
        context.fillRect(x - r, y - r, 2 * r, 2 * r);
      }
      context.closePath();

      //image data manipulation => make black pixels transparent
      const imageData = context.getImageData(0, 0, canvasWidth, canvasHeight);
      const imageDataLength = imageData.data.length;
      for (let i = 0; i <= imageDataLength - 4; i += 4) {
        if (imageData.data[i] === 0) {
          imageData.data[i + 3] = 0;
        }
      }
      context.putImageData(imageData, 0, 0);
      const image = new Image();
      image.src = this
        .canvas
        .toDataURL();
      this[backgroundStorageObject] = image;
    }

    addEventListeners() {
      const handleKeyDown = this
        .handleKeyDown
        .bind(this);
      const handleKeyUp = this
        .handleKeyUp
        .bind(this);
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
    }

    loadNextLevel() {
      switch (this.level) {
        case 0:
          this.level = 1;
          this.loadLevel1();
          break;
        case 1:
          this.level = 2;
          this.loadLevel2();
          break;
        case 2:
          this.level = 3;
          this.loadLevel3();
          break;
        case 3:
          this.level = 4;
          this.loadLevel4();
          break;
        case 4:
          this.level = 5;
          this.loadLevel5();
          break;
        case 5:
          this.level = Infinity;
          this.finishGame();
          break;
        default:
          break;
      }
    }

    centerObjectHorizontallyOnCanvas(object, canvas) {
      object.xPos = (canvas.width - object.width) / 2;
    }

    writeTextOnOverlay(text) {
      const canvasOverlay = this.canvasOverlay;
      canvasOverlay.textContent = text;
      canvasOverlay.style.opacity = 1;
    }

    hideOverlay() {
      const canvasOverlay = this.canvasOverlay;
      canvasOverlay.style.opacity = 0;
    }

    clearOverlay() {
      const canvasOverlay = this.canvasOverlay;
      canvasOverlay.textContent = null;
    }

    createMinionEnemy(xPos, originalYPos, targetYPos, shotFrequency) {
      const minion = {
        xPos,
        targetYPos,
        yPos: originalYPos,
        lifePoints: 1,
        totalLife: 1,
        lifeSpan: 0,
        shotFrequency
      };
      this.getImageFile('img/js.png', 50, 50, minion);
      this
        .enemies
        .push(minion);
    }

    createAnnoyingEnemy(xPos, originalYPos, targetYPos) {
      const enemy = {
        xPos,
        targetYPos,
        yPos: originalYPos,
        lifePoints: 3,
        totalLife: 3,
        lifeSpan: 0,
        shotFrequency: 60
      };
      this.getImageFile('img/ie.png', 50, 50, enemy);
      this
        .enemies
        .push(enemy);
    }

    createBoss() {
      const enemy = {
        xPos: 50,
        targetYPos: 50,
        yPos: -150,
        lifePoints: 60,
        totalLife: 60,
        lifeSpan: 0,
        shotFrequency: 30
      };
      this.getImageFile('img/jquery.png', 133, 500, enemy);
      this
        .enemies
        .push(enemy);
    }

    endGame() {
      const canvasOverlay = this.canvasOverlay;
      canvasOverlay.style.backgroundColor = 'rgba(200, 0, 0, 0.4)';
      setTimeout(this.writeTextOnOverlay.bind(this, "TE FAULTEAZĂ TEHNOLOGIA"), 100);
    }

    finishGame() {
      const canvasOverlay = this.canvasOverlay;
      canvasOverlay.style.backgroundColor = 'rgba(0, 255, 0, 0.4)';
      setTimeout(this.writeTextOnOverlay.bind(this, "AI FOST MEEEGIC!"), 100);
    }

    loadLevel1() {
      const createEnemies = () => {
        this.booleans.areControlsEnabled = true;
        for (let i = 1; i <= 6; i++) {
          this.createMinionEnemy(25 + 100 * (i - 1), -50, 50, 30);
        }
        setTimeout(() => {
          this.booleans.isShootingEnabled = true;
        }, 2000);
      }
      setTimeout(this.writeTextOnOverlay.bind(this, "LEVEL 1"), 1000);
      setTimeout(this.hideOverlay.bind(this), 3000);
      setTimeout(this.clearOverlay.bind(this), 6000);
      setTimeout(createEnemies, 6000);
    }

    loadLevel2() {
      const createEnemies = () => {
        this.booleans.areControlsEnabled = true;
        for (let i = 1; i <= 6; i++) {
          this.createMinionEnemy(25 + 100 * (i - 1), -150, 50, 20);
          this.createMinionEnemy(25 + 100 * (i - 1), -50, 150, 20);
        }
        setTimeout(() => {
          this.booleans.isShootingEnabled = true;
        }, 2000);
      }
      setTimeout(this.writeTextOnOverlay.bind(this, "MERGE CA-N FILME!"), 2000);
      setTimeout(this.writeTextOnOverlay.bind(this, "LEVEL 2"), 6000);
      setTimeout(this.hideOverlay.bind(this), 9000);
      setTimeout(this.clearOverlay.bind(this), 9000);
      setTimeout(createEnemies, 9000);
    }

    loadLevel3() {
      const createEnemies = () => {
        this.booleans.areControlsEnabled = true;
        for (let i = 1; i <= 6; i++) {
          this.createAnnoyingEnemy(25 + 100 * (i - 1), -150, 50);
          this.createMinionEnemy(25 + 100 * (i - 1), -50, 150, 20);
        }
        setTimeout(() => {
          this.booleans.isShootingEnabled = true;
        }, 2000);
      }
      setTimeout(this.writeTextOnOverlay.bind(this, "CEAS!"), 2000);
      setTimeout(this.writeTextOnOverlay.bind(this, "LEVEL 3"), 6000);
      setTimeout(this.hideOverlay.bind(this), 9000);
      setTimeout(this.clearOverlay.bind(this), 9000);
      setTimeout(createEnemies, 9000);
    }

    loadLevel4() {
      const createEnemies = () => {
        this.booleans.areControlsEnabled = true;
        for (let i = 1; i <= 6; i++) {
          this.createAnnoyingEnemy(25 + 100 * (i - 1), -175, 25);
          this.createAnnoyingEnemy(25 + 100 * (i - 1), -50, 150);
        }
        setTimeout(() => {
          this.booleans.isShootingEnabled = true;
        }, 2000);
      }
      setTimeout(this.writeTextOnOverlay.bind(this, "SUPER ȘMECHER!"), 2000);
      setTimeout(this.writeTextOnOverlay.bind(this, "LEVEL 4"), 6000);
      setTimeout(this.hideOverlay.bind(this), 9000);
      setTimeout(this.clearOverlay.bind(this), 9000);
      setTimeout(createEnemies, 9000);
    }

    loadLevel5() {
      const createEnemies = () => {
        this.booleans.areControlsEnabled = true;
        this.createBoss();
        setTimeout(() => {
          this.booleans.isShootingEnabled = true;
        }, 2000);
      }
      setTimeout(this.writeTextOnOverlay.bind(this, "Bine b0$$!"), 2000);
      setTimeout(this.writeTextOnOverlay.bind(this, "LEVEL 5"), 6000);
      setTimeout(this.hideOverlay.bind(this), 9000);
      setTimeout(this.clearOverlay.bind(this), 9000);
      setTimeout(createEnemies, 9000);
    }

    getImageFile(imageUrl, imageHeight, imageWidth, storageVariable) {
      let image = new Image();
      image.src = imageUrl;

      // storage variable must be image
      storageVariable.width = imageWidth;
      storageVariable.height = imageHeight;
      storageVariable.image = image;
    }

    requestAnimationFrame(drawFrame) {
      requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame;
      requestAnimationFrame(drawFrame.bind(this));
    }

    handleMovement(xPos, speed, canvasWidth, playerWidth) {
      let newXPos = xPos;
      if (this.booleans.isLeftArrowPressed) 
        newXPos -= speed;
      if (this.booleans.isRightArrowPressed) 
        newXPos += speed;
      if (newXPos < 10) {
        newXPos = 10;
      }
      if (newXPos > canvasWidth - (playerWidth + 10)) {
        newXPos = canvasWidth - (playerWidth + 10);
      }
      if (this.booleans.areControlsEnabled) {
        return newXPos;
      } else {
        return xPos;
      }

    }

    drawAnimationFrame(timeStamp) {
      // declare and get animation variables
      if (!this.initialTimeStamp) {
        this.initialTimeStamp = timeStamp;
      }
      const animationTime = timeStamp - this.initialTimeStamp;
      const {width: canvasWidth, height: canvasHeight} = this.canvas;
      const context = this.context;
      const player = this.player;
      this.frameCount++;
      // animation handlers
      this.player.xPos = this.handleMovement(player.xPos, player.speed, canvasWidth, player.width);
      // draw frame
      context.clearRect(0, 0, canvasWidth, canvasHeight);
      this.drawBackground(this.frameCount);
      this.drawLifes(context, canvasHeight);
      this.drawPlayer(context, player);
      this.drawEnemies(context, this.frameCount);
      if (this.booleans.isShootingEnabled && this.enemies.length === 0) {
        this.loadNextLevel();
        this.booleans.isShootingEnabled = false;
      }
      if (this.playerLifes.count === 0 && this.booleans.hasGameEnded === false) {
        this.booleans.hasGameEnded = true;
        this.level = Infinity;
        this.endGame();
      } else if (this.playerLifes.count !== 0) {
        this.createFriendlyShots(this.frameCount);
        this.drawEnemyShots(context);
        this.drawFriendlyShots(context);
      }
      // request drawing of next frame
      this.requestAnimationFrame(this.drawAnimationFrame);
    }

    drawEnemies(context, frameCount) {
      const enemies = this.enemies;
      const length = enemies.length;
      for (let i = 0; i < length; i++) {
        const enemy = enemies[i];
        context.drawImage(enemy.image, enemy.xPos, enemy.yPos, enemy.width, enemy.height);
        context.fillStyle = "red";
        context.beginPath();
        context.fillRect(enemy.xPos, enemy.yPos - 5, enemy.width * enemy.lifePoints / enemy.totalLife, 3);
        context.closePath();
        if (enemy.yPos < enemy.targetYPos) {
          enemy.yPos++;
        } else {
          if (enemy.lifeSpan % enemy.shotFrequency === 0) {
            if (enemy.totalLife === 3) {
              this.createEnemyShot(enemy, "ie");
            } else if (enemy.totalLife === 60) {
              this.createEnemyShot(enemy, "boss");
            } else {
              this.createEnemyShot(enemy);
            }
          }
        }
        enemy.lifeSpan++;
      }
    }

    drawPlayer(context, player) {
      if (this.player.isVulnerable) {
        context.globalAlpha = 1;
      } else {
        if (this.frameCount % 10 < 5) {
          context.globalAlpha = 0.4;
        } else {
          context.globalAlpha = 0.7;
        }
      }
      context.drawImage(player.image, player.xPos, player.yPos, player.width, player.height);
      context.globalAlpha = 1;
    }

    drawLifes(context, canvasHeight) {
      const playerLifes = this.playerLifes;
      for (let i = 1; i <= playerLifes.count; i++) {
        const xPos = (i - 1) * (playerLifes.width + 10) + 5;
        const yPos = canvasHeight - playerLifes.height - 5;
        context.drawImage(playerLifes.image, xPos, yPos, playerLifes.width, playerLifes.height);
      }
    }

    drawBackground(frameCount) {
      const context = this.context;
      const {width: canvasWidth, height: canvasHeight} = this.canvas;
      context.drawImage(this.backgroundFar, 0, this.backgroundFarY - canvasHeight);
      context.drawImage(this.backgroundFar, 0, this.backgroundFarY);
      context.drawImage(this.backgroundMiddle, 0, this.backgroundMiddleY - canvasHeight);
      context.drawImage(this.backgroundMiddle, 0, this.backgroundMiddleY);
      context.drawImage(this.backgroundNear, 0, this.backgroundNearY - canvasHeight);
      context.drawImage(this.backgroundNear, 0, this.backgroundNearY);
      if (frameCount % 1 == 0) {
        if (this.backgroundNearY < 600) {
          this.backgroundNearY += 1.75;
        } else {
          this.backgroundNearY = 0;
        }
        if (this.backgroundMiddleY < 600) {
          this.backgroundMiddleY += 0.85;
        } else {
          this.backgroundMiddleY = 0;
        }
        if (this.backgroundFarY < 600) {
          this.backgroundFarY += 0.5;
        } else {
          this.backgroundFarY = 0;
        }
      }
    }

    createEnemyShot(enemy, shotType) {
      const player = this.player;
      const shots = this.enemyShots;
      let shot = {},
        shot1 = {},
        shot2 = {};
      if (!shotType) {
        const shotYPos = enemy.yPos + enemy.height + 5;
        const ySpeed = 5;
        const shotLifeSpan = (player.yPos + player.height / 2 - shotYPos) / ySpeed;
        const shotXPos = enemy.xPos + enemy.width / 2;
        const xSpeed = (player.xPos + player.width / 2 - shotXPos) / shotLifeSpan;
        shot = {
          ySpeed,
          xSpeed,
          xPos: shotXPos,
          yPos: shotYPos,
          type: 'normal',
          radius: 5
        };
      } else if (shotType === 'ie') {
        const shotYPos = enemy.yPos + enemy.height + 5;
        const ySpeed = 3;
        const shotXPos = enemy.xPos + enemy.width / 2;
        const xSpeed = function () {
          if (player.xPos + player.width / 2 >= this.xPos) {
            return 5;
          } else {
            return -5;
          }
        }
        shot = {
          ySpeed,
          xSpeed,
          xPos: shotXPos,
          yPos: shotYPos,
          type: 'ie',
          radius: 5
        };
      } else {
        const shotYPos = enemy.yPos + enemy.height + 5;
        const ySpeed = 5;
        const shotXPos = enemy.xPos + enemy.width / 2;
        const xSpeed = function () {
          if (player.xPos + player.width / 2 >= this.xPos) {
            return 5;
          } else {
            return -5;
          }
        }
        shot = {
          ySpeed,
          xSpeed,
          xPos: shotXPos,
          yPos: shotYPos,
          type: 'boss',
          radius: 15
        };
        shot1 = Object.assign({}, shot, {
          xPos: shotXPos - 150
        });
        shot2 = Object.assign({}, shot, {
          xPos: shotXPos + 150
        });
        shots.push(shot1, shot2);
      }
      shots.push(shot);
    }

    drawEnemyShots(context) {
      const enemyShots = this.enemyShots;
      let numberOfEnemyShots = enemyShots.length;
      for (let i = 0; i < numberOfEnemyShots; i++) {
        const shot = enemyShots[i];
        const hasShotCollided = this.detectEnemyShotCollision(shot);
        let shotXPos;
        if (typeof shot.xPos === 'function') {
          shotXPos = shot.xPos();
        } else {
          shotXPos = shot.xPos;
        }
        if (shot.type === 'normal') {
          const star = context.createRadialGradient(shotXPos, shot.yPos, 0, shotXPos, shot.yPos, 5);
          star.addColorStop(0, 'rgba(255,255,0,1)');
          star.addColorStop(0.8, 'rgba(255,255,0,0.8)');
          star.addColorStop(1, 'rgba(255,255,0,0)');
          context.fillStyle = star;
          context.fillRect(shot.xPos - 5, shot.yPos - 5, 2 * 5, 2 * 5);
        } else if (shot.type === 'boss') {
          const star = context.createRadialGradient(shotXPos, shot.yPos, 0, shotXPos, shot.yPos, 15);
          star.addColorStop(0, 'rgba(255,0,0,1)');
          star.addColorStop(0.8, 'rgba(255,100,0,0.8)');
          star.addColorStop(1, 'rgba(0,0,255,0)');
          context.fillStyle = star;
          context.fillRect(shot.xPos - 15, shot.yPos - 15, 2 * 15, 2 * 15);
        } else {
          const star = context.createRadialGradient(shotXPos, shot.yPos, 0, shotXPos, shot.yPos, 5);
          star.addColorStop(0, 'rgba(0,0,255,1)');
          star.addColorStop(0.8, 'rgba(0,0,255,0.8)');
          star.addColorStop(1, 'rgba(0,0,255,0)');
          context.fillStyle = star;
          context.fillRect(shot.xPos - 5, shot.yPos - 5, 2 * 5, 2 * 5);
        }
        let shotXSpeed;
        if (typeof shot.xSpeed === 'function') {
          shotXSpeed = shot.xSpeed();
        } else {
          shotXSpeed = shot.xSpeed;
        }
        shot.xPos += shotXSpeed;
        shot.yPos += shot.ySpeed;
        if (shot.yPos > this.canvas.width || hasShotCollided) {
          enemyShots.splice(i, 1);
          numberOfEnemyShots--;
          i--;
        }
      }
    }

    detectEnemyShotCollision(shot) {
      const player = this.player;
      let hasShotCollided = false;
      if (shot.yPos >= player.yPos + 10 - shot.radius && shot.yPos <= player.yPos + player.height / 2 + 5 + shot.radius) {
        if (shot.xPos >= player.xPos + 10 - shot.radius && shot.xPos <= player.xPos + player.width - 10 + shot.radius) {
          if (player.isVulnerable) {
            this.playerLifes.count--;
            player.isVulnerable = false;
            if (this.playerLifes.count) {
              setTimeout(() => {
                player.isVulnerable = true;
              }, 500)
            } else {
              this.booleans.isShootingEnabled = false;
              this.booleans.areControlsEnabled = false;
            }
          }
          hasShotCollided = true;
        }
      }
      return hasShotCollided;
    }

    createFriendlyShots(frameCount) {
      const changeShotBrace = () => {
        if (this.openBracketShot) {
          this.openBracketShot = false;
        } else {
          this.openBracketShot = true;
        }
      };

      const createShot = () => {
        const {player, shots, openBracketShot} = this;
        const newShot = {
          xPos: player.xPos + player.width / 2 + 6,
          yPos: player.yPos - 4,
          char: openBracketShot
            ? '{'
            : '}'
        };
        shots.push(newShot);
        changeShotBrace();
      };

      if (this.booleans.isSpaceKeyPressed && this.booleans.isShootingEnabled) {
        if (this.firstShotFrameNumber) {
          if ((frameCount - this.firstShotFrameNumber) % 20 == 0) {
            createShot();
          }
        } else {
          this.firstShotFrameNumber = frameCount;
          createShot();
        }
      } else {
        this.firstShotFrameNumber = null;
      }
    }

    detectPlayerShotCollision(shot) {
      const enemies = this.enemies;
      let numberOfEnemies = enemies.length;
      let hasShotCollided = false;
      for (let i = 0; i < numberOfEnemies; i++) {
        const enemy = enemies[i];
        if (shot.yPos <= enemy.yPos + 55) {
          if (shot.xPos >= enemy.xPos - 10 && shot.xPos <= enemy.xPos + enemy.width + 20) {
            hasShotCollided = true;
            if (enemy.lifePoints > 1) {
              enemy.lifePoints--;
            } else {
              enemies.splice(i, 1);
              numberOfEnemies--;
              i--;
            }

          }
        }
      }
      return hasShotCollided;
    }

    drawFriendlyShots(context) {
      let shotsNumber = this.shots.length;
      const shots = this.shots;
      context.fillStyle = 'lime';
      context.shadowColor = 'lime';
      context.shadowBlur = 3;
      context.save();
      // context.translate(this.player.xPos, this.player.yPos);
      context.rotate(-Math.PI / 2);
      context.textAlign = 'center';
      for (let i = 0; i < shotsNumber; i++) {
        const shot = shots[i];
        context.fillText(shot.char, -shot.yPos, shot.xPos);
        shot.yPos -= 4;
        if (shot.yPos < -20 || this.detectPlayerShotCollision(shot)) {
          shots.splice(i, 1);
          shotsNumber--;
          i--;
        }
      }
      context.restore();
      context.shadowBlur = 0;
    }

    handleKeyDown(e) {
      e.preventDefault();
      // console.log('Pressing \'' + e.key + '\''); // log keyPress
      switch (e.key) {
        case 'ArrowLeft':
          this.booleans.isLeftArrowPressed = true;
          break;
        case 'ArrowRight':
          this.booleans.isRightArrowPressed = true;
          break;
        case ' ':
          this.booleans.isSpaceKeyPressed = true;
          break;
        default:
          return;
      }
    }

    handleKeyUp(e) {
      e.preventDefault();
      // console.log('Realeasing ', e.key); // log keyRelease
      switch (e.key) {
        case 'ArrowLeft':
          this.booleans.isLeftArrowPressed = false;
          break;
        case 'ArrowRight':
          this.booleans.isRightArrowPressed = false;
          break;
        case ' ':
          this.booleans.isSpaceKeyPressed = false;
          break;
        default:
          return;
      }
    }
  }

  const Module = new CanvasModule(canv);
  return Module;
})();

window.onload = () => {
  document
    .getElementById('canv')
    .focus();
  GameModule.initializeModule();
};