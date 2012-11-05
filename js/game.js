(function() {
    
    window.onload = function() {
        console.log("page ready, starting CraftyJS");
        Crafty.init(1024, 768);
        Crafty.canvas.init();
        
        var player = Crafty.e('2D, Canvas, Fourway, Color')
                        //render at [20, 20] and have a width and height of 48px
                        .attr({x: 20, y: 20, w: 48, h: 48})
                        
                        //red box
                        .color('#f00')
                        
                        //move with arrow keys and move 3px per keypress
                        .fourway(3);
    };
    
})();