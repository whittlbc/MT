define(function(require, exports, module) {
    var View = require('famous/core/View');
    var Surface = require('famous/core/Surface');
    var Transform = require('famous/core/Transform');
    var StateModifier = require('famous/modifiers/StateModifier');
    var ImageSurface = require('famous/surfaces/ImageSurface');

    function SongView(size) {

        View.apply(this, arguments);

        this.options.size = size;

        this.displacement = 0;

        this.votePosition = 0;

        this.beenChanged = false;

        this.lock = false;

        this.voteLock = false;

        this.beenVoted = false;

        this.rootModifier = new StateModifier({
            size: this.options.size,
        });

        this.mainNode = this.add(this.rootModifier);   

        _addSongArt.call(this);
        // _addUpArrow.call(this);
        // _addInitials.call(this);
        _createListeners.call(this);  
  
    }

    SongView.prototype = Object.create(View.prototype);
    SongView.prototype.constructor = SongView;

    // SongView.prototype.addCoverFilm = function(voteCount, songTitle){

    //     this.coverFilm = new Surface({
    //         size: [1.0522*this.options.size[0], 1.2665*this.options.size[1]],
    //         content: voteCount+'<br><span style="font-size: '+(0.08328*this.options.size[1])+'px; white-space: nowrap; letter-spacing: 0.8px; color: white; text-shadow: none; font-weight: normal">'+ songTitle +'</span>',
    //         properties: {
    //             webkitBackfaceVisibility: 'visible',
    //             backgroundColor: 'rgba(0,0,0,0.525)',
    //             fontSize: (0.27*this.options.size[1])+'px',
    //             fontFamily: 'Track',
    //             borderTop: '1.5px solid rgba(0,0,0,0.5)',  
    //             borderRight: '1.5px solid rgba(0,0,0,0.5)',
    //             borderLeft: '1.5px solid rgba(0,0,0,0.5)',
    //             borderBottom: (0.2498*this.options.size[1])+'px solid rgba(0,0,0,0.5)',
    //             borderRadius: '0 0 '+(0.06662*this.options.size[1])+'px '+(0.06662*this.options.size[1])+'px',
    //             textAlign: 'center',
    //             fontWeight: 'bolder',
    //             color: 'white',
    //             paddingTop: (0.4164*this.options.size[1])+'px',
    //             paddingLeft: (0.0348*this.options.size[0])+'px',
    //             lineHeight: (0.4331*this.options.size[1])+'px'
    //         }
    //     });

    //     this.coverFilmModifier = new StateModifier({
    //         transform: Transform.translate(-1.5, -1.5, 0.5),
    //     });

    //     this.mainNode.add(this.coverFilmModifier).add(this.coverFilm);

    //     this.coverFilm.on('click', function(e){

    //         if(e.detail != null){

    //             return false;
    //         }

    //         else{

    //             this._eventOutput.emit('clickedSong');
    //         }

    //     }.bind(this));

    // };

    SongView.DEFAULT_OPTIONS = {
        placeholder: null
    }; 

    //----------------------Helper Functions--------------------

    function _addSongArt(){

        this.songArt = new ImageSurface({
            size: this.options.size,
            properties: {
                webkitBackfaceVisibility: 'visible',
                boxShadow: '0 0 10px rgba(255,255,255,0.5)',

            }
        });

        this.songArtModifier = new StateModifier();

        this.add(this.songArtModifier).add(this.songArt);

    }

    // function _addUpArrow(){

    //     this.upArrow = new Surface({
    //         size: [0.333*this.options.size[1], 0.333*this.options.size[1]],
    //         content: '&brvbar',  
    //         properties: {
    //             fontSize: (0.5*this.options.size[1])+'px',
    //             fontFamily: 'Arrow',
    //             textAlign: 'center',
    //             color: 'white',
    //             paddingTop: (0.05*this.options.size[1])+'px',
    //             paddingLeft: '1px'
    //         }
    //     });

    //     this.upArrowModifier = new StateModifier({
    //         transform: Transform.translate(0.333*this.options.size[0], 0.12*this.options.size[1], 1)
    //     });

    //     this.mainNode.add(this.upArrowModifier).add(this.upArrow);
    // }



    // function _addInitials(){

    //     this.initials = new Surface({
    //         size: [0.2*this.options.size[1], 0.2*this.options.size[1]],
    //         properties: {
    //             fontSize: (0.1*this.options.size[1])+'px',
    //             fontFamily: 'CoverTileFont',
    //             fontWeight: 'bold',
    //             textAlign: 'center',
    //             color: 'white'
    //         }
    //     });

    //     this.initialsModifier = new StateModifier({
    //         transform: Transform.translate(0.01*this.options.size[0], 0.02*this.options.size[1], 1)
    //     });

    //     this.mainNode.add(this.initialsModifier).add(this.initials);

    // }


    function _createListeners (){

        var that = this;

        this.songArt.on('click', function(e){

            if(e.detail != null){

                return false;
            }

            else{

                if (!this.lock){

                    this.lock = true;

                    this._eventOutput.emit('clickedSong');

                    setTimeout(function(){

                        that.lock = false;

                    }, 500);
                }                
            }

        }.bind(this));

        // this.initials.on('click', function(e){

        //     if(e.detail != null){

        //         return false;
        //     }

        //     else{

        //         if (!this.lock){

        //             this.lock = true;

        //             this._eventOutput.emit('clickedSong');

        //             setTimeout(function(){

        //                 that.lock = false;

        //             }, 500);
        //         }                     
        //     }

        // }.bind(this));

        // this.upArrow.on('click', function(e){

        //     if(e.detail != null){

        //         return false;
        //     }

        //     else{

        //         if (!this.voteLock){

        //             this.voteLock = true;

        //             if (this.votePosition == 1){

        //                 this._eventOutput.emit('removeFromUp');

        //             }
        //             else if (this.votePosition==0){

        //                 this._eventOutput.emit('upVote');

        //             }
        //             else {

        //                 console.log('Error: You got a "votePosition" value of something different than 0 or 1');
        //             }

        //             setTimeout(function(){

        //                 that.voteLock = false;

        //             }, 750);
        //         }

        //     }

        // }.bind(this));

    }



    module.exports = SongView;
});
