(function() {
    Crafty.c('AnimationLoader', {
        init: function() {
            this.requires("2D, Canvas, SpriteAnimation");
        },
        animationLoader: function(name) {
            var jsonurl = 'anims/' + name + '.json';
            var spritesheet = 'img/' + name + '.png';
            var self = this;
            
            $.getJSON(jsonurl, function(data) {
                var spriteSize = data.width * 2;
                var spriteData = {};
                spriteData[name] = [0, 0];
                
                Crafty.sprite(spriteSize, spritesheet, spriteData);
                
                self.requires(name);
                
                _.each(data.animations, function(data, animName) {
                    console.log(animName, data);
                    self.animate(animName, 0, data.row, data.length - 1);
                });
                
                self.trigger('AnimsLoaded');
            });
        }
    });
})();