/* jshint esversion: 6 */
const Game = {

	init: function() {

		this.addCanvas();

		this.AudioContext = false;
		this.bullits = [];
		this.fps = 0;
		this.debug = 0;
		this.hasAudio = false;
		this.move = false;
		this.oldTimeStamp = 0;
		this.player = {
			color: "#fff",
			direction: {
				x: 0,
				y: 0
			},
			gun: {
				fire: function() {
					if ( this.nextShotIn === 0 ) {
						Game.shoot();
						this.nextShotIn = this.fireRate;
					}
				},
				fireRate: 10,
				nextShotIn: 0,
				update: function() {
					if ( this.nextShotIn > 0 ) {
						this.nextShotIn -= 1;
					}
				},
			},
			height: 20,
			sprites: {
				hull: [0, 0, 36, 20],
				exhaust: [48, 0, 12, 12]
			},
			speed: {
				x: 500,
				y: 250
			},
			width: 36,
			x: 0,
			y: 0,
			yReach: 300,
		};
		this.sounds = {
			shoot: {
				src: 'shoot.wav',
			}
		};
		this.stars = [];
		this.starsSpeedMultiplier = 1;
		this.secondsPassed = 0;
		this.world = {
			backgroundColor: '#000',
			height: window.innerHeight,
			padding: 20,
			starCount: 30,
			width: window.innerWidth
		};

		this.player.x = ( this.canvas.width / 2 ) - ( this.player.width / 2 );
		this.player.y = this.canvas.height - this.player.height - 20;

		this.sprites = new Image();
		this.sprites.src = './assets/images/galaxus/sprites.png';

		this.addStyleSheet();
		this.initStars();
		this.addEventListeners();

		this.sprites.onload = function() {
			window.requestAnimationFrame( Game.loop );
		};

		this.instructions();
	},

	addCanvas: function() {

		this.canvas = document.createElement("canvas");

		this.canvas.setAttribute( "height", window.innerHeight );
		this.canvas.setAttribute( "width", window.innerWidth );

		document.body.appendChild( this.canvas );

		this.ctx = this.canvas.getContext("2d");
	},

	addStyleSheet: function() {

		link = document.createElement( "link" );

		link.setAttribute( "rel", "stylesheet" );
		link.setAttribute( "href", "./assets/css/index.css" );

		document.head.appendChild(link);
	},

	addEventListeners: function() {

		document.body.onmousemove = function( event ) {

			Game.canvas.style.cursor = "default";
		};

		document.body.onkeydown = function( event ) {

			Game.createAudioContext();
			Game.canvas.style.cursor = "none";

			// Space.
			if ( 32 === event.keyCode ) {
				Game.player.shooting = 1;
			}

			// Left arrow or A.
			if ( [ 37, 65 ].includes( event.keyCode ) ) {
				Game.player.direction.x = -1;
			}

			// Right arrow or D.
			if ( [ 39, 68 ].includes( event.keyCode ) ) {
				Game.player.direction.x = 1;
			}

			// Up arrow or W.
			if ( [ 38, 87 ].includes( event.keyCode ) ) {
				Game.player.direction.y = -1;
			}

			// Down arrow or S.
			if ( [ 40, 83 ].includes( event.keyCode ) ) {
				Game.player.direction.y = 2;
			}
		};

		document.body.onkeyup = function( event ) {

			// Space.
			if ( 32 === event.keyCode ) {
				Game.player.shooting = 0;
			}

			// Left or right arrow, A or D.
			if ( [ 37, 39, 65, 68 ].includes( event.keyCode ) ) {
				Game.player.direction.x = 0;
			}

			// Up or down arrow, W or S.
			if ( [ 38, 40, 83, 87 ].includes( event.keyCode ) ) {
				Game.player.direction.y = 0;
			}
		};

		window.onblur = function() {
			Game.player.shooting = 0;
		};

		window.onresize = function( event ) {

			Game.world.height = this.innerHeight;
			Game.world.width = this.innerWidth;

			Game.canvas.setAttribute( "height", Game.world.height );
			Game.canvas.setAttribute( "width", Game.world.width );

			Game.player.x = ( Game.canvas.width / 2 ) - ( Game.player.width / 2 )  ;
			Game.player.y = Game.canvas.height - Game.player.height - 20;
		};
	},

	createAudioContext: function() {

		if ( false !== this.AudioContext ) {
			return;
		}

		if ( 'AudioContext' in window ) {

			this.AudioContext = new window.AudioContext();

			const gainNode = this.AudioContext.createGain();

			gainNode.gain.value = 1;

			for ( const [ key, value ] of Object.entries( this.sounds ) ) {

				this.sounds[ key ].buffer = false;

				window.fetch( `./assets/audio/${value.src}` )
					.then( function( response ) { return response.arrayBuffer(); } )
					.then( function( arrayBuffer ) {
						Game.AudioContext.decodeAudioData(
							arrayBuffer,
							function ( audioBuffer ) {
								Game.sounds[ key ].buffer = audioBuffer;
							},
							function( error ) {
								console.error( error );
							}
						);
					});
			}
		}
	},

	loop: function( timeStamp ) {

		Game.secondsPassed = ( timeStamp - Game.oldTimeStamp ) / 1000;
		Game.oldTimeStamp  = timeStamp;

		Game.update();
		Game.draw();

		window.requestAnimationFrame( Game.loop );
	},

	update: function() {

		this.fps = Math.round( 1 / Game.secondsPassed );

		this.updatePlayer();
		this.updateBullits();
		this.updateStars();
	},

	updatePlayer: function() {

		const movementX = this.player.direction.x * this.player.speed.x;
		const movementY = this.player.direction.y * this.player.speed.y;

		const xMin = this.world.padding;
		const xMax = this.world.width - this.player.width - this.world.padding;
		const yMax = this.world.height - this.player.width - this.world.padding;
		const yMin = Math.floor( Math.max( yMax - this.player.yReach, this.world.height / 2 ) );

		this.player.x += ( movementX * Game.secondsPassed || 0 );
		this.player.y += ( movementY * Game.secondsPassed || 0 );

		this.player.x = Math.min( Math.max( parseInt( this.player.x ), xMin ), xMax );
		this.player.y = Math.min( Math.max( parseInt( this.player.y ), yMin ), yMax );

		if ( 0 === movementY && this.player.y < yMax ) {
			this.player.y = Math.min( parseInt( this.player.y ) + 2, yMax );
		}

		this.starsSpeedMultiplier = ( ( this.player.y - yMax ) * -0.01 ) + 1;

		this.player.gun.update();

		if ( this.player.shooting ) {
			this.player.gun.fire();
		}
	},

	updateBullits: function() {

		this.bullits.forEach( function( bullit, index ) {

			bullit.y += ( bullit.speed * Game.secondsPassed || 0 );

			if ( bullit.y < 0 ) {
				Game.bullits.splice( index, 1 );
			}
		} );
	},

	updateStars: function() {

		this.stars.forEach( function( star, index ) {

			star.y += ( ( star.speed * Game.starsSpeedMultiplier ) * Game.secondsPassed || 0 );

			if ( star.y > Game.world.height ) {
				star.x = Math.floor( Math.random() * Game.world.width );
				star.y = 0;
			}
		} );
	},

	draw: function() {

		this.ctx.fillStyle = this.world.backgroundColor;

		this.ctx.clearRect( 0, 0, this.canvas.width, this.canvas.height );
		this.ctx.fillRect( 0, 0, this.canvas.width, this.canvas.height );

		this.drawStars();
		this.drawBullits();
		this.drawPlayer();
		this.drawDebug();
	},

	drawBullits: function() {

		this.bullits.forEach( function( bullit, index ) {

			bullit.y = bullit.y - bullit.speed;

			if ( bullit.y < 0 - bullit.height ) {
				Game.bullits.splice( index, 1 );
			}

			Game.ctx.drawImage(
				Game.sprites,
				bullit.sprite[0],
				bullit.sprite[1],
				bullit.sprite[2],
				bullit.sprite[3],
				bullit.x,
				bullit.y,
				bullit.width,
				bullit.height
			);
		} );
	},

	drawStars: function() {
		this.stars.forEach( function( star, index ) {
			Game.ctx.fillStyle = star.color;
			Game.ctx.fillRect( star.x, star.y, star.width, star.height );
		} );
	},

	drawDebug: function() {

		if ( ! this.debug ) {
			return;
		}

		this.ctx.fillStyle = "#333";
		this.ctx.fillRect( 0, 0, 60, 22 );

		this.ctx.font      = "14px Arial";
		this.ctx.fillStyle = "#000";
		this.ctx.fillText( "FPS: " + this.fps, 4, 16);
	},

	drawPlayer: function() {

		// drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
		this.ctx.drawImage(
			Game.sprites,
			Game.player.sprites.hull[0],
			Game.player.sprites.hull[1],
			Game.player.sprites.hull[2],
			Game.player.sprites.hull[3],
			Game.player.x,
			Game.player.y,
			Game.player.width,
			Game.player.height
		);

		if ( Game.player.direction.y < 0 ) {

			this.ctx.drawImage(
				Game.sprites,
				Game.player.sprites.exhaust[0],
				Game.player.sprites.exhaust[1],
				Game.player.sprites.exhaust[2],
				Game.player.sprites.exhaust[3],
				Game.player.x + ( Game.player.width / 2 ) - ( Game.player.sprites.exhaust[2] / 2 ),
				Game.player.y + Game.player.height,
				Game.player.sprites.exhaust[2],
				Game.player.sprites.exhaust[3]
			);
		}
	},

	initStars: function() {

		const variations = [
			{
				height: 1,
				color: "#f1f1f1",
				speed: 20,
				width: 1,
			},
			{
				height: 2,
				color: "#111",
				speed: 30,
				width: 2,
			},
			{
				color: "#999",
				height: 2,
				speed: 60,
				width: 2,
			},
			{
				height: 2,
				color: "#FFF",
				speed: 200,
				width: 2,
			}
		];

		while ( this.stars.length < this.world.starCount ) {

			const index = Math.floor( Math.random() * ( 4 - 1 + 1 ) + 1 ) - 1;

			const star = {
				color: variations[ index ].color,
				height: variations[ index ].height,
				speed: variations[ index ].speed * this.getRandomIntInclusive( 1, 1.5 ),
				width: variations[ index ].width,
				x: 0,
				y: 0,
			};

			star.x = Math.floor( Math.random() * this.world.width );
			star.y = Math.floor( Math.random() * this.world.height );

			this.stars.push( star );
		}
	},

	shoot: function() {

		const bullit = {
			color: "#ffff00",
			height: 20,
			speed: 12,
			sprite: [40, 0, 4, 20],
			width: 4,
			x: 0,
			y: 0
		};

		bullit.x = this.player.x + ( this.player.width / 2 ) - bullit.width / 2;
		bullit.y = this.player.y;

		this.bullits.push( bullit );

		this.playSound( 'shoot' );
	},

	playSound: function( key ) {

		if ( ! this.sounds[ key ] ) {
			return;
		}

		if ( ! this.sounds[ key ].buffer ) {
			return;
		}

		const source = this.AudioContext.createBufferSource();
		source.buffer = this.sounds[key].buffer;
		source.connect( this.AudioContext.destination );
		source.start();
	},

	getRandomIntInclusive: function( min, max ) {

		min = Math.ceil( min );
		max = Math.floor( max );

		// The maximum is inclusive and the minimum is inclusive.
		return Math.random() * ( max - min + 1 ) + min;
	},

	instructions: function() {
		console.log( 'Move: Arrow Keys' );
		console.log( 'Shoot: Space' );
		console.log( 'Debug: Game.debug = true' );
	}
};
