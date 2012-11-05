(function() {
    
    Crafty.c('Actor', {
        init: function() {
            this.requires('AnimationLoader');
            
            this.bind('AnimsLoaded', function() {
                this.bind('NewDirection', this.onNewDirection);
                this.animate('idle_down', 30, -1);
            });
        },
        onNewDirection: function(direction) {
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
    
    var Game = function() {
        Crafty.scene('main', this.mainScene);
    };
    
    Game.prototype.initCrafty = function() {
        console.log("page ready, starting CraftyJS");
        Crafty.init(1024, 768);
        Crafty.canvas.init();
    };
    
    Game.prototype.mainScene = function() {
        var player = Crafty.e('Actor, Player, Fourway')
                        //render at [20, 20] and have a width and height of 48px
                        .attr({x: 20, y: 20})
                        .animationLoader('goldenarmor')
                        .fourway(3);
        
        var boss = Crafty.e('Actor, Boss')
                        //render at [20, 20] and have a width and height of 48px
                        .attr({x: 500, y: 500})
                        .animationLoader('boss');
    };
    
    window.onload = function() {
        var game = new Game();
        game.initCrafty();
        Crafty.scene('main');
    };
    
})();