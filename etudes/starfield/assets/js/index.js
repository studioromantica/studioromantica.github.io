/* jshint esversion: 6 */
const Game = {

	init: function() {

		this.AudioContext = false;
		this.bullits = [];
		this.canvas = document.getElementById("canvas");
		this.ctx = this.canvas.getContext("2d");
		this.fps = 0;
		this.debug = 0;
		this.hasAudio = false;
		this.move = false;
		this.oldTimeStamp = 0;
		this.player = {
			color: "#fff",
			direction: 0,
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
			speed: 500,
			width: 100,
			x: 0,
			y: 0
		};
		this.sounds = {
			shoot: {
				src: 'shoot.wav',
			}
		};
		this.stars = [];
		this.secondsPassed = 0;
		this.world = {
			backgroundColor: '#000',
			height: window.innerHeight,
			padding: 20,
			starCount: 30,
			width: window.innerWidth
		};

		this.canvas.setAttribute( "height", this.world.height );
		this.canvas.setAttribute( "width", this.world.width );

		this.player.x = ( this.canvas.width / 2 ) - ( this.player.width / 2 );
		this.player.y = this.canvas.height - this.player.height - 20;

		this.initStars();
		this.addEventListeners();

		window.requestAnimationFrame( this.loop );
	},

	addEventListeners: function() {

		document.body.onmousemove = function( event ) {

			Game.canvas.style.cursor = "default";
		};

		document.body.onkeydown = function( event ) {

			Game.createAudioContext();
			Game.canvas.style.cursor = "none";

			// Space.
			if ( event.keyCode === 32 ) {
				Game.player.shooting = 1;
			}

			// Left arrow.
			if ( event.keyCode === 37 ) {
				Game.player.direction = -1;
			}

			// Right arrow.
			if ( event.keyCode === 39 ) {
				Game.player.direction = 1;
			}
		};

		document.body.onkeyup = function( event ) {

			// Space.
			if ( event.keyCode === 32 ) {
				Game.player.shooting = 0;
			}

			// Left or right arrow.
			if ( event.keyCode === 37 || event.keyCode === 39 ) {
				Game.player.direction = 0;
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

				window.fetch( `./starfield/assets/audio/${value.src}` )
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

		const movement = this.player.direction * this.player.speed;

		this.player.x += ( movement * Game.secondsPassed || 0 );

		if ( this.player.x <= this.world.padding ) {
			this.player.x = this.world.padding;
		}

		if ( this.player.x >= this.world.width - this.player.width - this.world.padding ) {
			this.player.x = this.world.width - this.player.width - this.world.padding;
		}

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

			star.y += ( star.speed * Game.secondsPassed || 0 );

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

			Game.ctx.fillStyle = bullit.color;
			Game.ctx.fillRect( bullit.x, bullit.y, bullit.width, bullit.height );

			bullit.y = bullit.y - bullit.speed;

			if ( bullit.y < 0 - Game.world.padding ) {
				Game.bullits.splice( index, 1 );
			}
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

		this.ctx.fillStyle = this.player.color;
		this.ctx.fillRect( this.player.x, this.player.y, this.player.width, this.player.height );
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
			height: 10,
			speed: 20,
			width: 10,
			x: 0,
			y: 0
		};

		bullit.x = this.player.x + ( this.player.width / 2 ) - bullit.width / 2;
		bullit.y = this.player.y - bullit.height;

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
};

document.addEventListener( "DOMContentLoaded", function( event ) {
	Game.init();
});
