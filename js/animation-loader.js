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
                var spriteData = {};
                spriteData[name] = [0, 0];
                
                self.attr({w: data.width * 2, h: data.height * 2});
                
                Crafty.sprite(data.width * 2, data.height * 2, spritesheet, spriteData);
                
                self.requires(name);
                
                _.each(data.animations, function(data, animName) {
                    console.log(animName, data);
                    self.animate(animName, 0, data.row, data.length - 1);
                });
                
                self.trigger('AnimsLoaded');
            });
            
            return this;
        }
    });
})();