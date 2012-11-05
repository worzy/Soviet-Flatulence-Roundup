(function() {
    
    //base component for Actors - i.e. Players, Enemies, NPCs etc.
    Crafty.c('Actor', {
        init: function() {
            //uses the AnimationLoader component to load the sprites and data.
            //we are reusing the sprites and data from BrowserQuest: https://github.com/mozilla/BrowserQuest
            this.requires('AnimationLoader, Delay, Collision');
            
            this.bind('AnimsLoaded', function() {
                //once the animations are loaded, bind our movement handler to the NewDirection event
                this.bind('NewDirection', this.onNewDirection);
                
                //set the initial animation to an idle one
                this.animate('idle_down', 30, -1);
            });
            
            this.bind('AttackEnd', function() {
                this.attacking = false;
            });
        },
        attack: function() {
            this.attacking = true;
            this.triggerAnimation('atk');
            var hit = this.hit('Enemy');
            if(hit) {
                this.trigger('HitEnemy', hit);
            }
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
                        this.trigger('AttackEnd');
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
    //we have to compose an armor and a weapon component together.
    Crafty.c('Player', {
        init: function() {
            this.armor = Crafty.e('Actor, Fourway, Armor, Keyboard')
                .animationLoader('goldenarmor');
            
            this.weapon = Crafty.e('Actor, Fourway, Weapon, Keyboard')
                .animationLoader('goldensword')
                .bind('HitEnemy', function(hits) {
                     console.log('hit enemy', hits);
                 });
                
            _.each([this.armor, this.weapon], function(i) {
                i.attr({x: 20, y: 20})
                 .fourway(3)
                 .bind('KeyDown', function() {
                     if(this.isDown('SPACE')) {
                         this.attack();
                     }
                 });
            });
            
            var self = this;
            this.armor.bind('Moved', function() {
                self.attr({x: self.armor.x, y: self.armor.y});
            });
            
            this.requires('2D')
                .attr({w: this.armor.attr('w'), h: this.armor.attr('h')})
                .requires('Collision')
                .collision(new Crafty.polygon(
                    [10, 10],
                    [10, 54],
                    [54, 54],
                    [54, 10]
                ));
        }
    });
    
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
        
        //and an enemy
        var boss = Crafty.e('Actor, Boss, Enemy') //here, Boss and Enemy are just tags - we can use them
                                                  //when checking for collisions
                        //render at [500, 500]
                        .attr({x: 500, y: 500})
                        
                        //this loads up the sprite data
                        .animationLoader('boss');
    };
    
    $(document).ready(function() {
        var game = new Game();
        game.initCrafty();
        
        //play the main scene
        Crafty.scene('main');
    });
    
})();