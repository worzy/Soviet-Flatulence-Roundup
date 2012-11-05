(function() {
    
    window.onload = function() {
        console.log("page ready, starting CraftyJS");
        Crafty.init(1024, 768);
        Crafty.canvas.init();
        
        Crafty.c('PlayerAnim', {
            init: function() {
                this.requires('AnimationLoader, Fourway')
                    .attr({w: 64, h: 64})
                    .fourway(3)
                    .animationLoader('goldenarmor');
                
                this.bind('AnimsLoaded', function() {
                    this.bind('NewDirection', function (direction) {
                        
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
                    });
                    this.animate('idle_down', 30, -1);
                });
            }
        });
        
        var player = Crafty.e('PlayerAnim')
                        //render at [20, 20] and have a width and height of 48px
                        .attr({x: 20, y: 20});
    };
    
})();