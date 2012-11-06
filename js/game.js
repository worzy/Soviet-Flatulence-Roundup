(function() {
    
    Crafty.c('ViewportBounded', {
        init: function() {
            this.requires('2D');
        },
        checkOutOfBounds: function(oldPosition) {
            if(!this.within(0, 0, Crafty.viewport.width, Crafty.viewport.height)) {
                console.log('out of bounds', this.pos(), oldPosition);
                this.attr({x: oldPosition.x, y: oldPosition.y});
            }
        }
    });
    
    //base component for Actors - i.e. Players, Enemies, NPCs etc.
    Crafty.c('Actor', {
        init: function() {
            //uses the AnimationLoader component to load the sprites and data.
            //we are reusing the sprites and data from BrowserQuest: https://github.com/mozilla/BrowserQuest
            
            //Delay component allows us to use the delay function to schedule timeouts that pause when
            //the game loop pauses.
            
            //Collision component allows us to react to collisions with other entities
            this.requires('AnimationLoader, Delay');
            
            //once the animations are loaded...
            this.bind('AnimsLoaded', function() {
                this.requires('Collision');
                //set the initial animation to an idle one
                this.animate('idle_down', 30, -1);
            });
        },
        attack: function() {
            this.triggerAnimation('atk');
        },
        triggerAnimation: function(type) {
            var direction = this.direction || 'down';
            
            //left direction animations are just right animations that are flipped
            if (this.direction === 'left') {
                direction = 'right';
            }
            
            var animationName = type + "_" + direction;
            
            if(type === 'walk') {
                this.stop().animate(animationName, 10, -1);
            } else if(type === 'idle') {
                this.stop().animate(animationName, 30, -1);
            } else if(type === 'atk') {
                
                //create a named function so we can unbind it using this reference later
                function onEnd() {
                    //delay this by one game tick as the animation is ended straight after
                    //this callback returns.
                    this.delay(function() {
                        this.triggerAnimation('idle');
                    }, 1);
                    
                    this.unbind('AnimationEnd', onEnd); //clean up after ourselves and unbind the event handler
                }
                
                this.stop().animate(animationName, 10, 0);
                this.bind('AnimationEnd', onEnd.bind(this)); //when the animation ends, trigger the 'onEnd' function above
            }
            
            return this;
        },
        onNewDirection: function(direction) {
            //Handler for the 'NewDirection' event fire by the Fourway component.
            //Here, we record the direction and if it changes, we swap the playing animation
            
            if (direction.x < 0) {
                if (this.direction !== 'left') {
                    this.direction = 'left';
                    this.triggerAnimation('walk').flip();
                }
            }
            if (direction.x > 0) {
                if (this.direction !== 'right') {
                    this.direction = 'right';
                    this.triggerAnimation('walk').unflip();
                    
                }
            }
            if (direction.y < 0) {
                if (this.direction !== 'up') {
                    this.direction = 'up';
                    this.triggerAnimation('walk');
                }
            }
            if (direction.y > 0) {
                if (this.direction !== 'down') {
                    this.direction = 'down';
                    this.triggerAnimation('walk');
                }
            }
            
            //if direction.x and direction.y are undefined or 0, then change animation
            //to an idle one, using the last direction we stored.
            if(!direction.x && !direction.y) {
                this.stop();
                if (this.direction === 'left' || this.direction === 'right') {
                    this.triggerAnimation('idle');
                } else if (this.direction === 'up') {
                    this.triggerAnimation('idle');
                } else {
                    this.triggerAnimation('idle');
                }
            }
        }
    });
    
    //Player component - because of the way that the BrowserQuest assets are rendered,
    //we have to compose armor and weapon entities together.
    //This component also has the behaviour for when the player attacks.
    Crafty.c('Player', {
        init: function() {
            this.armor = Crafty.e('Actor, Armor')
                .animationLoader('goldenarmor');
            
            this.weapon = Crafty.e('Actor, Weapon')
                .animationLoader('goldensword');
            
            //this component does not need Canvas or DOM components since all the rendering is
            //done by the armor and weapon. It reacts to the arrow keys (via Fourway component)
            //and to the space bar for attack.
            this.requires('2D, Fourway, Keyboard, ViewportBounded')
                .attr({w: 64, h: 64})
                .fourway(3)
                .bind('KeyDown', function() {
                    if(this.isDown('SPACE')) {
                        //space bar has been pressed
                        this.armor.attack();
                        this.weapon.attack();
                        this.attack();
                    }
                })
                .requires('Collision')
                //create a custom hit map here:
                .collision(new Crafty.polygon(
                    [-10, -10],
                    [-10, 34],
                    [34, 34],
                    [34, -10]
                ));
            
            //this will move the armor and weapon entities in lockstep with the player component
            this.attach(this.armor, this.weapon);
            
            //start at position [64,64]
            this.attr({x: 64, y: 64});
            
            //bind our movement handler to the NewDirection event
            this.bind('NewDirection', function(direction) {
                this.armor.onNewDirection(direction);
                this.weapon.onNewDirection(direction);
            });
            
            this.bind('Moved', function(oldPosition) {
                this.checkOutOfBounds(oldPosition);
            });
        },
        attack: function() {
            //check whether we are colliding with an Enemy component
            var hit = this.weapon.hit('Enemy');
            if(hit) {
                console.log('hit enemy', hit);
                this.trigger('HitEnemy', hit.length);
            }
        }
    });
    
    Crafty.c('Enemy', {
        init: function() {
            this.requires('2D, Delay, Tween, Actor');
            this.bind('TweenEnd', this.onMoveEnd);
            this.delay(this.move, 2000);
        },
        move: function() {
            var hit = this.hit('Player');
            if (hit) {
                this.attack();
                this.trigger('HitPlayer');
            } else {
                var xMovement = Crafty.math.randomInt(-100, 100);
                var yMovement = Crafty.math.randomInt(-100, 100);

                var newPos = {
                    x: this.x + xMovement,
                    y: this.y + yMovement,
                    w: this.w,
                    h: this.h
                };

                if(this.within.call(newPos, 0, 0, Crafty.viewport.width, Crafty.viewport.height)) {
                    this.onNewDirection({x: xMovement, y: yMovement});
                    this.tween({x: newPos.x, y: newPos.y}, 60);
                }
            }
            
            this.delay(this.move, 2000);
        },
        onMoveEnd: function() {
            this.onNewDirection({x: 0, y: 0});
        }
    });
    
    Crafty.c('Score', {
        init: function() {
            this.score = 0;
            this.requires('2D, Canvas, Text');
            this._textGen = function() {
                return "Score: " + this.score;
            };
            this.attr({w: 100, h: 20, x: 900, y: 0})
                .text(this._textGen);
        },
        increment: function() {
            this.score = this.score + 1;
            this.text(this._textGen);
        },
        decrement: function() {
            this.score = this.score - 1;
            this.text(this._textGen);
        }
    })
    
    var Game = function() {
        Crafty.scene('loading', this.loadingScene);
        Crafty.scene('main', this.mainScene);
    };
    
    Game.prototype.initCrafty = function() {
        console.log("page ready, starting CraftyJS");
        Crafty.init(1000, 600);
        Crafty.canvas.init();
        
        Crafty.modules({ 'crafty-debug-bar': 'release' }, function () {
            Crafty.debugBar.show();
        });
    };
    
    Game.prototype.loadingScene = function() {
        var loading = Crafty.e('2D, Canvas, Text, Delay');
        loading.attr({x: 512, y: 200, w: 100, h: 20});
        loading.text('loading...');
        
        function onLoaded() {
            loading.delay(function() {
                Crafty.scene('main');
            }, 500);
            
        }
        
        function onProgress(progress) {
            loading.text('loading... ' + progress.percent + '% complete');
        }
        
        function onError() {
            loading.text('could not load assets');
        }
        
        Crafty.load([
            'img/boss.png',
            'img/deathknight.png',
            'img/goldenarmor.png',
            'img/goldensword.png'
        ], 
        onLoaded, onProgress, onError);
        
    };
    
    Game.prototype.mainScene = function() {
        //create a player...
        var player = Crafty.e('Player');
        
        //and an enemy or two
        var enemy = Crafty.e('Actor, Enemy')
            .attr({x: 350, y: 100})
            .animationLoader('deathknight');
        
        var boss = Crafty.e('Actor, Boss, Enemy') //here, Boss and Enemy are just tags - we can use them
                                                  //when checking for collisions
                        //render at [500, 500]
                        .attr({x: 500, y: 500})
                        
                        //this loads up the sprite data
                        .animationLoader('boss');
        
        var score = Crafty.e('Score');
        
        player.bind('HitEnemy', function() {
            score.increment();
        });
        
        Crafty('Enemy').bind('HitPlayer', function() {
            score.decrement();
        });
    };
    
    $(document).ready(function() {
        var game = new Game();
        game.initCrafty();
        
        //play the main scene
        Crafty.scene('loading');
    });
    
})();