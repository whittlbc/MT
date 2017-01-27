define(function(require, exports, module) {
    var View = require('famous/core/View');
    var Surface = require('famous/core/Surface');
    var Transform = require('famous/core/Transform');
    var StateModifier = require('famous/modifiers/StateModifier');

    function SongInfoView(size) {
        View.apply(this, arguments);

        this.options.size = size;

        this.rootModifier = new StateModifier({
            size: this.options.size,
            transform: Transform.thenMove(Transform.rotateY(0.11), [0, -0.01*this.options.size[1], 0]),
            opacity: 0
        });

        this.mainNode = this.add(this.rootModifier);

        _addShadowSurface.call(this);
        _addSong.call(this);
        _addArtist.call(this);
        _addUpArrow.call(this);
        _addDownArrow.call(this);
        _addVoteCount.call(this);
        _addPosterName.call(this);
        _createListeners.call(this);
    }

    SongInfoView.prototype = Object.create(View.prototype);
    SongInfoView.prototype.constructor = SongInfoView;

    SongInfoView.DEFAULT_OPTIONS = {
        placeholder: null
    };


    //-----------------------Helper Functions-------------------


    function _addShadowSurface(){

        this.shadowSurface = new Surface({
            size: [140, 1], 
            properties: {
                backgroundColor: 'rgba(0,0,0,0.865)', 
                boxShadow: '0 0 '+(0.03*this.options.size[1])+'px '+(0.3223*this.options.size[1])+'px rgba(0, 0, 0, 0.785)',
                zIndex: 0          
            }
        });

        this.shadowSurfaceModifier = new StateModifier({
            origin: [0.5, 1],
            align: [0.5, 1],
            transform: Transform.translate(-0.01*this.options.size[0], -0.065*this.options.size[1], 200),
        });

        this.mainNode.add(this.shadowSurfaceModifier).add(this.shadowSurface);

    }


    function _addSong (){

        this.song = new Surface({
            size: [true, true],
            properties: {
                color: 'white',
                fontSize: (0.015*this.options.size[1])+'px',
                fontFamily: 'HelveticaNeue',
                textAlign: 'center',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                zIndex: 1
            }
        });

        this.songModifier = new StateModifier({
            origin: [0.5, 1],
            align: [0.5, 1],
            transform: Transform.translate(0, -0.303*this.options.size[1], 201),
        });

        this.mainNode.add(this.songModifier).add(this.song);
    }


    function _addArtist (){

        this.artist = new Surface({
            size: [true, true],
            properties: {
                color: 'rgba(195,195,195,1)',
                fontSize: (0.014*this.options.size[1])+'px',
                fontFamily: 'HelveticaNeue',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                zIndex: 1
            }
        });

        this.artistModifier = new StateModifier({
            origin: [0.5, 1],
            align: [0.5, 1],
            transform: Transform.translate(0, -0.2775*this.options.size[1], 201),
        });

        this.mainNode.add(this.artistModifier).add(this.artist);
    }


    function _addUpArrow(){

        this.upArrow = new Surface({
            size: [0.03748*this.options.size[1], 0.03748*this.options.size[1]],
            content: '<i class="fa fa-chevron-up"></i>',  
            properties: {
                fontSize: (0.0325*this.options.size[1])+'px',
                textAlign: 'center',
                color: 'white',
                lineHeight: (0.03898*this.options.size[1])+'px',
                zIndex: 1
            }
        });

        this.upArrowModifier = new StateModifier({
            origin: [0.5, 1],
            align: [0.5, 1],
            transform: Transform.translate(0, -0.236*this.options.size[1], 201),
        });

        this.mainNode.add(this.upArrowModifier).add(this.upArrow);

    }


    function _addDownArrow(){

        this.downArrow = new Surface({
            size: [0.03748*this.options.size[1], 0.03748*this.options.size[1]],
            content: '<i class="fa fa-chevron-down"></i>',  
            properties: {
                fontSize: (0.0325*this.options.size[1])+'px',
                textAlign: 'center',
                lineHeight: (0.03898*this.options.size[1])+'px',
                color: 'white',
                zIndex: 1
            }
        });

        this.downArrowModifier = new StateModifier({
            origin: [0.5, 1],
            align: [0.5, 1],
            transform: Transform.translate(0, -0.1735*this.options.size[1], 201),
        });

        this.mainNode.add(this.downArrowModifier).add(this.downArrow);

    }

    function _addVoteCount(){

        this.voteCount = new Surface({
            size: [0.10667*this.options.size[0], 0.0149925*this.options.size[1]],
            properties: {
                fontSize: (0.023988*this.options.size[1])+'px',
                textAlign: 'center',
                fontFamily: 'HelveticaNeue',
                color: 'white',
                lineHeight: (0.0149925*this.options.size[1])+'px',
                zIndex: 1,
                paddingLeft: '1px'
            }
        });

        this.voteCountModifier = new StateModifier({
            origin: [0.5, 1],
            align: [0.5, 1],
            transform: Transform.translate(0, -0.214*this.options.size[1], 201),
        });

        this.mainNode.add(this.voteCountModifier).add(this.voteCount);

    }


    function _addPosterName (){

        this.posterName = new Surface({
            size: [true, true],
            properties: {
                fontSize: (0.013*this.options.size[1])+'px',
                textAlign: 'center',
                fontFamily: 'HelveticaNeue',
                color: 'rgba(195,195,195,1)',
                whiteSpace: 'nowrap',
                zIndex: 1
            }
        });

        this.posterNameModifier = new StateModifier({
            origin: [0.5, 1],
            align: [0.5, 1],
            transform: Transform.translate(0, -0.146*this.options.size[1], 201),
        });

        this.mainNode.add(this.posterNameModifier).add(this.posterName);

    }


    function _createListeners(){

        this.upArrow.on('click', function(e){

            if(e.detail != null){

                return false;
            }
            else{

                this._eventOutput.emit('upVote');
            }

        }.bind(this));

        this.downArrow.on('click', function (e) {

             if(e.detail != null){

                return false;
            }
            else{

                this._eventOutput.emit('downVote');
            }

        }.bind(this));

        this.song.on('click', function () {
            
            this._eventOutput.emit('zoomOut');

        }.bind(this));

        this.artist.on('click', function () {
            
            this._eventOutput.emit('zoomOut');

        }.bind(this));

        this.posterName.on('click', function () {
            
            this._eventOutput.emit('zoomOut');

        }.bind(this));

        this.voteCount.on('click', function () {
            
            this._eventOutput.emit('zoomOut');

        }.bind(this));      
    
    }

    module.exports = SongInfoView;
});


