define(function(require, exports, module) {
    var Transform = require('famous/core/Transform');
    var Transitionable = require('famous/transitions/Transitionable');
    var RenderNode = require('famous/core/RenderNode');
    var OptionsManager = require('famous/core/OptionsManager');

    function Flipper(options) {
        this.options = Object.create(Flipper.DEFAULT_OPTIONS);
        this._optionsManager = new OptionsManager(this.options);
        if (options) this.setOptions(options);
    
        this._front = undefined;
        this._back = undefined;

        this._angle = new Transitionable(0);
        this._flipped = false;


    }

    Flipper.DIRECTION_X = 0;
    Flipper.DIRECTION_Y = 1;

    Flipper.DEFAULT_OPTIONS = {
        transition: {
            duration: 500,
            curve: 'linear'
        },
        direction: Flipper.DIRECTION_X
    };



    Flipper.prototype.flip = function flip(transition, callback) {

        if (!transition) transition = this.options.transition;

        var angle = 1;

        if (this._flipped) {
            angle = 0;
        }

        this._flipped = !this._flipped;

        this._angle.set(angle, transition, callback);
    };



    Flipper.prototype.setOptions = function setOptions(options) {
        return this._optionsManager.setOptions(options);
    };

    Flipper.prototype.setFront = function setFront(node) {
        this._front = node;
    };

    Flipper.prototype.setBack = function setBack(node) {
        this._back = node;
    };

    Flipper.prototype.render = function render() {


        this.frontSpec = {
            
            transform: Transform.rotateY(Math.PI * this._angle.get()), 

            target: this._front.render()
        };


        this.backSpec = {

            transform: Transform.thenMove(Transform.rotateY(Math.PI * (this._angle.get() + 1)), [0, 0, -1]),    //this reason for the " + 1 " is so that the backSpec is always one radian ahead of the frontSpec upon rotation --> allowing you to see the back of the surface upon it flipping around, making it look way more realistic. 
                        
            target: this._back.render()
        }

        return {
            origin: [.5, .5],
            align: [.5, .5],
            target: [this.frontSpec, this.backSpec]
        }
    };



    module.exports = Flipper;
    
});