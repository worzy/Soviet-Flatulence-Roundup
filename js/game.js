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
    
    //extend the 2D component, give it a centerPosition function
    Crafty.components()['2D'].centerPosition = function() {
        return new Crafty.math.Vector2D(this.x + (this.w / 2), this.y + (this.h / 2));
    };
    
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
                // set collision bounds from loaded animation bounds
                this.requires('Collision').collision(this.boundsAsPolygon());

                //set the initial animation to an idle one
                this.animate('idle_down', 30, -1);
            });
        },
        triggerAnimation: function(type) {
            var direction = this.direction || 'down';
            
            //left direction animations are just right animations that are flipped
            if (this.direction === 'left') {
                direction = 'right';
                this.flip();
            } else if(this.direction === 'right') {
                this.unflip();
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
                    this.triggerAnimation('walk');
                }
            }
            if (direction.x > 0) {
                if (this.direction !== 'right') {
                    this.direction = 'right';
                    this.triggerAnimation('walk');
                    
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
            
            //this component does not need Canvas or DOM components since all the rendering is
            //done by the armor and weapon. It reacts to the arrow keys (via Fourway component)
            //and to the space bar for attack.
            this.requires('2D, DOM, Fourway, Keyboard, ViewportBounded, Collision, agent')
                .fourway(3)
                .requires('Collision');
                
            
            
            //start at position [20,20]
            this.attr({x: 20, y: 20});
            
            this.bind('Moved', function(oldPosition) {
                this.checkOutOfBounds(oldPosition);
            });

            this.onHit('Flatule', function(hit){
                this.trigger('HitFlatule', hit.length);
                _.forEach(hit, function(item){
                    item.obj.destroy();
                });
            })
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

    Crafty.c('Flatule', {
        init: function(){
            this.requires('2D, DOM, Color, flatule');
        }
    })
    
    Crafty.c('Enemy', {
        init: function() {
            this.requires('2D, Delay, Tween, soviet, Collision');
            this.bind('TweenEnd', this.onMoveEnd);
            this.delay(this.move, 2000);
        },
        move: function() {
            var hit = false;
            if (hit) {
                this.attack(hit);
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
                    //this.onNewDirection({x: xMovement, y: yMovement});
                    this.tween({x: newPos.x, y: newPos.y}, 60);
                }
            }

            if(Crafty.math.randomInt(0, 4) === 0){
                this.fart();
            }
            
            this.delay(this.move, 2000);
        },
        attack: function(hit) {
            var player = hit[0].obj;
            var attackPosition = player.centerPosition();
            
            var attackAngle = Crafty.math.radToDeg(this.centerPosition().angleTo(attackPosition));
            
            if (Crafty.math.withinRange(attackAngle, -135, -45)) {
                //facing left
                this.direction = 'up';
            } else if(Crafty.math.withinRange(attackAngle, -45, 45)) {
                //facing up
                this.direction = 'right';
            } else if(Crafty.math.withinRange(attackAngle, 45, 135)) {
                //facing right
                this.direction = 'down';
            } else {
                //facing down
                this.direction = 'left';
            }
            
            this.triggerAnimation('atk');
            this.trigger('HitPlayer');
        },
        fart: function(){
            console.log('fart at'+ this.x + ' ' + this.y);
            Crafty.e('Flatule').attr({x: this.x, y: this.y});
        },
        onMoveEnd: function() {
            //this.onNewDirection({x: 0, y: 0});
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
            'img/agent_front.png',
            'img/bystander_front.png',
            'img/flatule.png'
        ], 
        onLoaded, onProgress, onError);
        
    };

    Crafty.sprite(48, 48, 'img/soviet_front.png', {
        'soviet': [0,0]
    });

    Crafty.sprite(48, 48, 'img/agent_front.png', {
        'agent': [0,0]
    });

    Crafty.sprite(48, 48, 'img/flatule.png', {
        'flatule': [0,0]
    });


    
    Game.prototype.mainScene = function() {
        Crafty.background('url(img/background.png)');
        //create a player...
        var player = Crafty.e('Player');

        var enemies = [];

        for(var i=0; i < 10; i++){
            enemies.push(Crafty.e('Actor, Enemy,')
                .attr({x: 350, y: 350}));
        }
        
        var score = Crafty.e('Score');
        
        player.bind('HitFlatule', function() {
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