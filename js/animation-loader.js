(function() {
    Crafty.c('AnimationLoader', {
        init: function() {
            this.requires("2D, DOM, SpriteAnimation");
        },
        animationLoader: function(name) {
            var jsonurl = 'anims/' + name + '.json';
            var spritesheet = 'img/' + name + '.png';
            var self = this;
            
            $.getJSON(jsonurl, function(data) {
                var scale = 2;
                var spriteData = {};
                spriteData[name] = [0, 0];
                
                self.attr({w: data.width * scale, h: data.height * scale});
                
                Crafty.sprite(data.width * scale, data.height * scale, spritesheet, spriteData);
                
                self.requires(name);
                var xPos = self.attr('x');
                var yPos = self.attr('y');
                
                //magic +16 pixels to offset is magic
                self.attr({
                    x: xPos + ((data.offset_x + 16) * scale), 
                    y: yPos + ((data.offset_y + 16) * scale)
                });
                
                _.each(data.animations, function(data, animName) {
                    self.animate(animName, 0, data.row, data.length - 1);
                });
                
                if (data.bounds !== undefined) {
                    var bounds = {
                        x: data.bounds[0] * scale, 
                        y: data.bounds[1] * scale, 
                        w: data.bounds[2] * scale, 
                        h: data.bounds[3] * scale
                    };
                    self._bounds = bounds;
                }

                self.trigger('AnimsLoaded');
            });
            
            return this;
        },
        boundsAsPolygon: function() {
            if (this._bounds) {
                var b = this._bounds;
                var poly = new Crafty.polygon([b.x,b.y], [b.x,b.y + b.h], [b.x + b.w, b.y + b.h], [b.x + b.w, b.y]);
                return poly;
            } else {
                return undefined;
            }
        }
    });
})();