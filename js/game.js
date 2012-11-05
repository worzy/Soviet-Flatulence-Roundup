(function() {
    
    //base component for Actors - i.e. Players, Enemies, NPCs etc.
    Crafty.c('Actor', {
        init: function() {
            //uses the AnimationLoader component to load the sprites and data.
            //we are reusing the sprites and data from BrowserQuest: https://github.com/mozilla/BrowserQuest
            this.requires('AnimationLoader');
            
            this.bind('AnimsLoaded', function() {
                //once the animations are loaded, bind our movement handler to the NewDirection event
                this.bind('NewDirection', this.onNewDirection);
                
                //set the initial animation to an idle one
                this.animate('idle_down', 30, -1);
            });
        },
        onNewDirection: function(direction) {
            //Handler for the 'NewDirection' event fire by the Fourway component.
            //Here, we record the direction and if it changes, we swap the playing animation
            
            if (direction.x < 0) {
                if (this.direction !== 'left') {
                    this.stop().animate("walk_right", 10, -1).flip();
                    this.direction = 'left';
                }
            }
            if (direction.x > 0) {
                if (this.direction !== 'right') {
                    this.stop().animate("walk_right", 10, -1).unflip();
                    this.direction = 'right';
                }
            }
            if (direction.y < 0) {
                if (this.direction !== 'up') {
                    this.stop().animate("walk_up", 10, -1);
                    this.direction = 'up';
                }
            }
            if (direction.y > 0) {
                if (this.direction !== 'down') {
                    this.stop().animate("walk_down", 10, -1);
                    this.direction = 'down';
                }
            }
            
            //if direction.x and direction.y are undefined or 0, then change animation
            //to an idle one, using the last direction we stored.
            if(!direction.x && !direction.y) {
                this.stop();
                if (this.direction === 'left' || this.direction === 'right') {
                    this.animate('idle_right', 30, -1);
                } else if (this.direction === 'up') {
                    this.animate('idle_up', 30, -1);
                } else {
                    this.animate('idle_down', 30, -1);
                }
            }
        }
    });
    
    //Player component - because of the way that the BrowserQuest assets are rendered,
    //we have to compose an armor and a weapon component together.
    Crafty.c('Player', {
        init: function() {
            this.armor = Crafty.e('Actor, Fourway, Armor')
                .animationLoader('goldenarmor');
            
            this.weapon = Crafty.e('Actor, Fourway, Weapon')
                .animationLoader('goldensword');
                
            _.each([this.player, this.weapon], function(i) {
                i.attr({x: 20, y: 20})
                 .fourway(3);
            });
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
    
    window.onload = function() {
        var game = new Game();
        game.initCrafty();
        
        //play the main scene
        Crafty.scene('main');
    };
    
})();