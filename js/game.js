(function() {
    
    //base component for Actors - i.e. Players, Enemies, NPCs etc.
    Crafty.c('Actor', {
        init: function() {
            //uses the AnimationLoader component to load the sprites and data.
            //we are reusing the sprites and data from BrowserQuest: https://github.com/mozilla/BrowserQuest
            this.requires('AnimationLoader, Delay, Collision');
            
            this.bind('AnimsLoaded', function() {
                this.collision(this.boundsAsPolygon());

                //once the animations are loaded, bind our movement handler to the NewDirection event
                this.bind('NewDirection', this.onNewDirection);
                
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
                var onEnd = function() {
                    //delay this by one game tick as the animation is ended straight after
                    //this callback returns.
                    this.delay(function() {
                        this.triggerAnimation('idle');
                    }, 1);
                    
                    this.unbind('AnimationEnd', onEnd); //clean up after ourselves and unbind the event handler
                };
                
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
    Crafty.c('Player', {
        init: function() {
            this.armor = Crafty.e('Actor, Armor')
                .animationLoader('goldenarmor');
            
            this.weapon = Crafty.e('Actor, Weapon')
                .animationLoader('goldensword');
            
            this.requires('2D, Fourway, Keyboard')
                .fourway(3)
                .bind('KeyDown', function() {
                    if(this.isDown('SPACE')) {
                        this.armor.attack();
                        this.weapon.attack();
                        this.attack();
                    }
                });
                // .requires('Collision')
                // .collision(new Crafty.polygon(
                //     [10, 10],
                //     [10, 54],
                //     [54, 54],
                //     [54, 10]
                // ));
            
            //this will move the armor and weapon entities in lockstep with the player component
            this.attach(this.armor, this.weapon);
            
            this.attr({x: 20, y: 20});
            
            //bind our movement handler to the NewDirection event
            this.bind('NewDirection', function(direction) {
                this.armor.onNewDirection(direction);
                this.weapon.onNewDirection(direction);
            });
        },
        attack: function() {
            var hit = this.weapon.hit('Enemy');
            if(hit) {
                console.log('hit enemy', hit);
                this.trigger('HitEnemy', hit.length);
            }
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
        }
    })
    
    var Game = function() {
        Crafty.scene('main', this.mainScene);
    };
    
    Game.prototype.initCrafty = function() {
        console.log("page ready, starting CraftyJS");
        Crafty.init(1024, 768);
        Crafty.canvas.init();
        
        Crafty.modules({ 'crafty-debug-bar': 'release' }, function () {
            Crafty.debugBar.show();
        });
    };
    
    Game.prototype.mainScene = function() {
        //create a player...
        var player = Crafty.e('Player');
        
        //and an enemy or two
        var enemy = Crafty.e('Actor, Enemy,')
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
    };
    
    $(document).ready(function() {
        var game = new Game();
        game.initCrafty();
        
        //play the main scene
        Crafty.scene('main');
    });
    
})();