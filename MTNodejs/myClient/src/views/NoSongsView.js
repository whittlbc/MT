define(function(require, exports, module) {
    var View = require('famous/core/View');
    var Surface = require('famous/core/Surface');
    var Transform = require('famous/core/Transform');
    var StateModifier = require('famous/modifiers/StateModifier');

    function NoSongsView(size) {
        View.apply(this, arguments);

        this.options.size = size;

        this.rootModifier = new StateModifier({
            size: this.options.size
        });

        this.mainNode = this.add(this.rootModifier);

        _createBackground.call(this);
        _createPhrase.call(this);

    }

    NoSongsView.prototype = Object.create(View.prototype);
    NoSongsView.prototype.constructor = NoSongsView;

    NoSongsView.DEFAULT_OPTIONS = {
        placeholder: null
    };


    //-----------------------Helper Functions-------------------


    function _createBackground(){

        this.backgroundSurface = new Surface({
            size: this.options.size
        });

        this.backgroundSurfaceModifier = new StateModifier({
            origin: [0.5, 0.5],
            align: [0.5, 0.5],
            transform: Transform.translate(0, 0, -1)
        });

        this.mainNode.add(this.backgroundSurfaceModifier).add(this.backgroundSurface);

    }


    function _createPhrase(){

        this.phraseSurface = new Surface({
            size: [0.8*this.options.size[0], 0.3*this.options.size[1]],
            content: "No songs yet",
            properties: {
                color: 'white',
                fontFamily: 'HelveticaNeue',
                fontWeight: 500,                      
                fontSize: (0.027*this.options.size[1])+'px',
                textAlign: 'center',
                lineHeight: (0.04577*this.options.size[1])+'px'
            }
        });

        this.phraseModifier = new StateModifier({
            origin: [0.5, 0.5],
            align: [0.5, 0.5],
            transform: Transform.translate(0, 0.09683*this.options.size[1], 0.1)
        });

        this.mainNode.add(this.phraseModifier).add(this.phraseSurface);

    }

    module.exports = NoSongsView;
});
