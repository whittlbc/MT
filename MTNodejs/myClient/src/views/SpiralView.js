define(function(require, exports, module) {
    var Engine        = require('famous/core/Engine');
    var View          = require('famous/core/View');
    var Surface       = require('famous/core/Surface');
    var Transform     = require('famous/core/Transform');
    var StateModifier = require('famous/modifiers/StateModifier');
    var Scrollview = require('famous/views/Scrollview');
    var Transitionable = require('famous/transitions/Transitionable');
    var Lightbox = require('famous/views/Lightbox');
    var ImageSurface = require('famous/surfaces/ImageSurface');
    var SnapTransition = require("famous/transitions/SnapTransition");
    var SpringTransition = require('famous/transitions/SpringTransition');
    Transitionable.registerMethod('spring', SnapTransition);
    Transitionable.registerMethod('spring2', SpringTransition);
    Transitionable.registerMethod('bounceSpring', SpringTransition);
    var Easing = require('famous/transitions/Easing');
    var SongView = require('views/SongView');
    var SongInfoView = require('views/SongInfoView');

    var spring = {
        method: 'spring',
        period: 100,
        dampingRatio: 0.8,
        velocity: 0
    };

    var spring2 = {
        method: 'spring2',
        period: 200,
        dampingRatio: 0.8
    };

    var bounceSpring = {
        method: 'bounceSpring',
        period: 150,
        dampingRatio: 0.36
    };


    function SpiralView(size) {

        View.apply(this, arguments);

        this.options.size = size;

        this.shownIndex = 0;

        this.lastPos = 0;

        this.goingDown = true;

        this.voteFadeDuration = 1000;        

        this.streamingName = null;

        this.songInfoArray = null;

        this.rollLock = false;

        this.pushLock = false;

        this.pausedIndex = null;

        this.myCount = 0;

        this.spiralChangeLock = false;

        this.flashNumber = 0;

        this.hidden = false;

        this.songVotedOnLink = null;

        this.playCount = 0;

        this.userHasPremium = false;

        this.flashHighlightOn = false;

        this.playingQueueID = null;

        this.currentSongIndex = 0;

        this.clickLock = false;

        this.firstQueueActivated = false;

        this.rootModifier = new StateModifier();

        this.zoomed = false;

        this.streamCreated = false;

        this.mainNode = this.add(this.rootModifier);

        _createScrollview.call(this);
        _addPlaylistNameTab.call(this);
        _addRemoveLockHandler.call(this);
        _addInfoLightbox.call(this);
        _addSongInfoView.call(this);
        _addObjCHandlers.call(this);
    }


    SpiralView.prototype = Object.create(View.prototype);
    SpiralView.prototype.constructor = SpiralView;

    SpiralView.prototype.zoomIn = function(){ 

        this.playlistNameTabModifier.setOpacity(0, {duration: 650});
        var that = this;
        setTimeout(function () {
            that.playlistNameTabModifier.setTransform(Transform.moveThen([0, -0.5*this.options.size[1], -100], Transform.rotateY(0.11)));
        }, 650);

        this.switchSongContent();

        this.infoLightbox.show(this.infoSlides[0]);

        // if (this.streamingID == this.userID){

        //     this.npLightbox.show(this.npSlides[0]);

        //     this.npView.rootModifier.setOpacity(1, {duration: 650});
                    
        // }

        this.songInfoView.rootModifier.setOpacity(1, {duration: 650});

        // 6-plus
        if (this.options.size[0] > 400){

            this.modifier.setTransform(Transform.translate(0.07*this.options.size[0], 0.05*this.options.size[1], 310), {duration: 650, curve: Easing.outQuad});

        }

        // 6
        else if (this.options.size[0] < 400 && this.options.size[0] > 350){

            if (this.playingQueueID == null){

                this.songInfoView.rootModifier.setTransform(Transform.thenMove(Transform.rotateY(0.11), [0, -0.01*this.options.size[1], 0]));
                this.modifier.setTransform(Transform.translate(0.09*this.options.size[0], 0.04*this.options.size[1], 330), {duration: 650, curve: Easing.outQuad});
            }
            else {

                this.songInfoView.rootModifier.setTransform(Transform.thenMove(Transform.rotateY(0.11), [0, -0.055*this.options.size[1], 0]));
                this.modifier.setTransform(Transform.translate(0.09*this.options.size[0], 0.015*this.options.size[1], 330), {duration: 650, curve: Easing.outQuad});

            }
        }

        // 5
        else {

            this.modifier.setTransform(Transform.translate(0.11*this.options.size[0], 0.04065*this.options.size[1], 350), {duration: 650, curve: Easing.outQuad});

        }

        this.zoomed = true;

        this.scrollview.setOptions({friction: .0055});

    };

    SpiralView.prototype.zoomOut = function(){

        this.playlistNameTabModifier.setTransform(Transform.moveThen([0, 0.205*this.options.size[1], -200], Transform.rotateY(0.11)));
        this.playlistNameTabModifier.setOpacity(1, {duration: 650});

        this.songInfoView.rootModifier.setOpacity(0, {duration: 550});

        this.infoLightbox.hide();

        if (this.options.size[0]>400){

            this.modifier.setTransform(Transform.translate(3, 0, 20), {duration: 650, curve: Easing.outQuad});  
        }

        // 6
        else if (this.options.size[0] < 400 && this.options.size[0] > 350){

            this.modifier.setTransform(Transform.translate(3, 0, 20), {duration: 650, curve: Easing.outQuad});  

        }
        // 5
        else {

            this.modifier.setTransform(Transform.translate(-2, 0, -10), {duration: 650, curve: Easing.outQuad});  
        }

        this.zoomed = false;
        
        this.scrollview.setOptions({friction: 0.001});

        if (this.streamingID == null){

            for (var i = 0; i < this.surfaces.length; i++){

                this.surfaces[i].songArt.setProperties({boxShadow: '0 0 9px rgba(255,255,255,0.7)'});  
            }
        }
        else {

            for (var i = 1; i < this.surfaces.length; i++){

                this.surfaces[i].songArt.setProperties({boxShadow: '0 0 9px rgba(255,255,255,0.7)'});  
            }
        }


    };


    SpiralView.prototype.calculateAbsolutePos = function (){

        this.absolutePos = Math.round(this.scrollview.getPosition() + ((this.scrollview._node.index)*(0.1796*this.options.size[0])));

        if (this.absolutePos != this.lastPos){

            if (this.absolutePos > this.lastPos){

                this.goingDown = true;
            }
            else {

                this.goingDown = false;
            }
            
            this.checkForIndexChange(this.absolutePos);

            this.lastPos = this.absolutePos;

        }        

    };


    SpiralView.prototype.checkForIndexChange = function(absPos){

        this.shownIndex = Math.round(absPos/(0.1796*this.options.size[0]));

        if (this.goingDown){

            if (this.shownIndex != this.scrollview._node.index && this.shownIndex != this.myLastIndex){

                if (this.shownIndex < 0){

                    this.shownIndex = 0;
                }

                if (this.shownIndex > this.songInfoArray.length-1){

                    this.shownIndex = this.songInfoArray.length-1;
                }

                this.myLastIndex = this.shownIndex;

                if (this.zoomed){

                    this.switchSongContent();
                }
            }

        }
        else {

            if (this.shownIndex != this.scrollview._node.index+1 && this.shownIndex != this.myLastIndex){

                if (this.shownIndex < 0){

                    this.shownIndex = 0;
                }
                if (this.shownIndex > this.songInfoArray.length-1){

                    this.shownIndex = this.songInfoArray.length-1;
                }

                this.myLastIndex = this.shownIndex;

                if (this.zoomed){

                    this.switchSongContent();
                }
            }
        }

    };


    SpiralView.prototype.switchSongContent = function(){

        if (this.songInfoArray[this.shownIndex]){

            var track = this.songInfoArray[this.shownIndex].track;
            var artist = this.songInfoArray[this.shownIndex].artist;

            if (track.length > 30){

                track = track.slice(0, 30) + '...';
            }

            if (artist.length > 35){

                artist = artist.slice(0, 35) + '...';
            }

            this.songInfoView.song.setContent(track);

            this.songInfoView.artist.setContent(artist);

            this.songInfoView.voteCount.setContent(this.songInfoArray[this.shownIndex].voteCount);

            this.songInfoView.posterName.setContent('Added by:&nbsp&nbsp' + this.songInfoArray[this.shownIndex].posterName.slice(0,30));

            if (this.goingDown){

                for (var i = 0; i < this.shownIndex; i++){

                    if (i == 0 && this.streamingID != null){


                    }
                    else {

                        this.surfaces[i].songArt.setProperties({boxShadow: '0 0 9px rgba(255,255,255,0.7)'});  
                    }

                }
            }
            else {

                for (var i = this.shownIndex+1; i < this.surfaces.length; i++){

                    this.surfaces[i].songArt.setProperties({boxShadow: '0 0 9px rgba(255,255,255,0.7)'});  

                }
            }

            this.surfaces[this.shownIndex].songArt.setProperties({boxShadow: '0 0 10px 5px rgba(0, 165, 190, 0.6)'});  

            this.songInfoView.upArrow.setProperties({color: 'white'});            
            this.songInfoView.downArrow.setProperties({color: 'white'});            

            if (this.surfaces[this.shownIndex].votePosition == 1){

                this.songInfoView.upArrow.setProperties({color: 'rgba(0,165,190,1)'});
            }
            if (this.surfaces[this.shownIndex].votePosition == -1){

                this.songInfoView.downArrow.setProperties({color: 'rgba(0,165,190,1)'});
            }
        }

    };


    SpiralView.prototype.setFirstSongsInfo = function () {

        var track = this.songInfoArray[0].track;
        var artist = this.songInfoArray[0].artist;

        if (track.length > 30){

            track = track.slice(0, 30) + '...';
        }

        if (artist.length > 35){

            artist = artist.slice(0, 35) + '...';
        }

        this.songInfoView.song.setContent(track);

        this.songInfoView.artist.setContent(artist);

        this.songInfoView.voteCount.setContent(this.songInfoArray[0].voteCount);

        this.songInfoView.posterName.setContent('Added by:&nbsp&nbsp' + this.songInfoArray[0].posterName.slice(0,30));

    };

    SpiralView.prototype.createListeners = function(){

        for (var i=0; i<this.surfaces.length; i++){

            this.surfaces[i].on('clickedSong', this.checkIfZoomed.bind(this, i));

        }

        this.songInfoView.on('upVote', function(){

            if (this.surfaces[this.shownIndex].votePosition == 0){

                this.songInfoView.upArrow.setProperties({color: 'rgba(0,165,190,1)'});

                this.checkIfVoteLockOff(this.shownIndex, false);

            }

        }.bind(this));

        this.songInfoView.on('downVote', function(){

            if (this.surfaces[this.shownIndex].votePosition == 0){

                this.songInfoView.downArrow.setProperties({color: 'rgba(0,165,190,1)'});

                this.checkIfVoteLockOff(this.shownIndex, true);

            }

        }.bind(this));

        this.songInfoView.on('zoomOut', function(){

            this._eventOutput.emit('zoomOut');

        }.bind(this));

    };


    SpiralView.prototype.addOneToListeners = function(i){

        this.surfaces[i].on('clickedSong', this.checkIfZoomed.bind(this, i));

    };

    SpiralView.prototype.checkIfZoomed = function(i, downVote){

        var that = this;

        if (this.zoomed){

            if ((i <= this.shownIndex+1) && (i >= this.shownIndex-1)){

                if (!this.streamLock && !this.clickLock){

                    if (this.userHasPremium){

                        this.clickLock = true;
                            
                        this.checkIfCanPlay(i);
                    }
                    else {

                        this._eventOutput.emit('checkIfUserHasAttemptedToLogin');
                    }

                }
            }
            else {

                if (i > this.shownIndex+1){

                    this._eventOutput.emit('zoomOut');
                }
            }

            // if (!this.streamLock && (i <= this.shownIndex+1) && (i >= this.shownIndex-1)){

            //     this.checkIfCanPlay(i);

            // }

        }

        else {

            this._eventOutput.emit('emitZoomIn');
        }

    };


    SpiralView.prototype.checkIfCanPlay = function(i){

        if (!this.spiralChangeLock){

            this.spiralChangeLock = true;

            this.playSelectedSong(i);

        }

    };


    SpiralView.prototype.checkIfVoteLockOff = function(i, downVote){

        if (!this.spiralChangeLock){

            this.spiralChangeLock = true;

            this.changeVoteCount(i, downVote);

        }

    };

    SpiralView.prototype.changeVoteCount = function(i, downVote) {

        var changeBy;

        if (downVote){

            changeBy = -1;
        }
        else {

            changeBy = 1;
        }

        if (this.songInfoArray[i].posterID != this.userID){

            var obj = {

                userID: this.songInfoArray[i].posterID,

                direction: changeBy
            }; 

            this._eventOutput.emit('applyTastePoints', obj);
        }

        this.bounceSong(i, changeBy, 0);

    };


    SpiralView.prototype.bounceSong = function(i, changeBy, y){

        y += 1.5;

        if (changeBy == 1){

            this.surfaces[i].songArtModifier.setTransform(Transform.translate(0, -y, 0));
        }
        else {

            this.surfaces[i].songArtModifier.setTransform(Transform.translate(0, y, 0));
        }

        var that = this;

        if (y > 25){

            y = 0;

            this.surfaces[i].songArtModifier.setTransform(Transform.translate(0, 0, 0), bounceSpring);

            setTimeout(function(){

                that.applyVote(i, changeBy);

            }, 200);

        }
        else {

            setTimeout(this.bounceSong.bind(this, i, changeBy, y), 0);

        }

    };


    SpiralView.prototype.applyVote = function(i, changeBy){

        this.surfaces[i].songArtModifier.setOpacity(0, {duration: this.voteFadeDuration});

        var newTime = new Date().getTime();

        var newVoteCount = this.songInfoArray[i].voteCount + changeBy;

        this.songInfoView.voteCount.setContent(newVoteCount);

        this.surfaces[i].voteCount = newVoteCount;

        this.surfaces[i].uploadTime = newTime;

        this.songInfoArray[i].voteCount = newVoteCount;

        this.songInfoArray[i].uploadTime = newTime;

        this.surfaces[i].votePosition = changeBy;

        var obj = {

            songLink: this.songInfoArray[i].link,

            newVoteCount: newVoteCount,

            changeBy: changeBy,

            newUploadTime: newTime
        };

        this._eventOutput.emit('updateDBVoteCount', obj);

        setTimeout(function (){

            if (newVoteCount == -3){

                if (i == 0){

                    if (this.streamingID == null){

                        this.surfaces.splice(i, 1);
                        this.songInfoArray.splice(i, 1);

                    }
                }
                else {

                    this.surfaces.splice(i, 1);
                    this.songInfoArray.splice(i, 1);

                }
            }

            this.sortNewSpiral();

        }.bind(this), 0.9*this.voteFadeDuration);

    };

    SpiralView.prototype.playSelectedSong = function(i){

        var minuteCount;
        var secondCount;
        var totalCount;
        var duration;
        var songToPlay;
        var songToRemove;

        if (i==0){

            this.currentSongLink = this.songInfoArray[0].link;

            songToPlay = this.currentSongLink;
            songToRemove = null;

            this.addHighlight();

            duration = this.songInfoArray[0].duration;

            if (duration.length == 4){
                minuteCount = Number(duration.charAt(0));
                if (duration.charAt(2)=='0'){
                    secondCount = Number(duration.charAt(3));
                }
                else {
                    secondCount = Number(duration.charAt(2) + duration.charAt(3));
                }
                totalCount = (minuteCount*60)+secondCount;
            }
            // > 10 min song
            else {
                minuteCount = Number(duration.charAt(0) + duration.charAt(1));
                if (duration.charAt(3)=='0'){
                    secondCount = Number(duration.charAt(4));
                }
                else {
                    secondCount = Number(duration.charAt(3) + duration.charAt(4));
                }
                totalCount = (minuteCount*60)+secondCount;

            }

            var sendObj = {

                songLink: this.currentSongLink,

                songName: this.songInfoArray[0].track,

                songArtist: this.songInfoArray[0].artist,

                songDuration: totalCount,

                humanDuration: this.songInfoArray[0].duration,

                addedBy: this.songInfoArray[0].posterName,

                queueID: this.currentQueueID,

                remove: 'no',

                rolling: 'no'
            };

        }

        // this is NOT the song currently playing
        else {

            songToPlay = this.songInfoArray[i].link;
            var removeLinkToPassToObjC;

            if (this.streamingID == null){

                songToRemove = null;
                removeLinkToPassToObjC = 'no';
            }
            else {

                songToRemove = this.songInfoArray[0].link;
                removeLinkToPassToObjC = songToRemove;
            }
 
            var surfaceZero = this.surfaces.splice(i, 1);
            
            var songZero = this.songInfoArray.splice(i, 1);

            if (this.streamingID != null){

                this.surfaces.shift();

                this.songInfoArray.shift();
            }

            this.surfaces.unshift(surfaceZero[0]);

            this.songInfoArray.unshift(songZero[0]);

            this.currentSongLink = songZero[0].link;

            this.rebuildSpiralComponents();

            duration = songZero[0].duration;

            if (duration.length == 4){
                minuteCount = Number(duration.charAt(0));
                if (duration.charAt(2)=='0'){
                    secondCount = Number(duration.charAt(3));
                }
                else {
                    secondCount = Number(duration.charAt(2) + duration.charAt(3));
                }
                totalCount = (minuteCount*60)+secondCount;
            }
            // > 10 min song
            else {

                minuteCount = Number(duration.charAt(0) + duration.charAt(1));
                if (duration.charAt(3)=='0'){
                    secondCount = Number(duration.charAt(4));
                }
                else {
                    secondCount = Number(duration.charAt(3) + duration.charAt(4));
                }
                totalCount = (minuteCount*60)+secondCount;

            }

            var sendObj = {

                songLink: this.currentSongLink,

                songName: songZero[0].track,

                songArtist: songZero[0].artist,

                songDuration: totalCount,

                humanDuration: songZero[0].duration,

                addedBy: songZero[0].posterName,

                queueID: this.currentQueueID,

                remove: removeLinkToPassToObjC,

                rolling: 'no'
            };

        }

        if (this.playingQueueID == null && this.zoomed){

            this.songInfoView.rootModifier.setTransform(Transform.thenMove(Transform.rotateY(0.11), [0, -0.055*this.options.size[1], 0]), {duration: 350, curve: Easing.outQuad});
            this.modifier.setTransform(Transform.translate(0.09*this.options.size[0], 0.015*this.options.size[1], 330), {duration: 350, curve: Easing.outQuad});
        }

        var passObj = {

            play: songToPlay,

            remove: songToRemove

        };

        this._eventOutput.emit('playSelectedSong', passObj);

        if (window.webkit){

            window.webkit.messageHandlers.playSelected.postMessage(sendObj);
        }
        else {

            window.location = "toolbar://playSelected/songLink:" + this.currentSongLink + ",songName:" + sendObj.songName + ",songArtist:" + sendObj.songArtist + ",songDuration:" + sendObj.songDuration + ",humanDuration:" + sendObj.humanDuration + ",addedBy:" + sendObj.addedBy + ",queueID:" + sendObj.queueID + ",remove:" + sendObj.remove + ",rolling:no";

        }

        this.spiralChangeLock = false;

    };


    SpiralView.prototype.removeHighlight = function(){

        this.surfaces[0].songArt.setProperties({boxShadow: '0 0 10px rgba(255, 255, 255, 0.73)'});  

    };


    SpiralView.prototype.addHighlight = function(){

        this.surfaces[0].songArt.setProperties({boxShadow: '0 0 15px 5px rgba(0, 165, 190, 0.6)'});    

    };


    SpiralView.prototype.addFlashingHighlight = function(i){

        var that = this;

        this.surfaces[i].songArt.setProperties({boxShadow: '0 0 30px 5px rgba(0, 165, 190, 0.66)'});  

        this.flashHighlightOn = true;

        setTimeout(function(){

            if (that.flashHighlightOn){

                that.surfaces[i].songArt.setProperties({boxShadow: '0 0 0 0 rgba(0, 0, 0, 0)'});  

                that.flashHighlightOn = false;
            }

        }, 6000);  

    };


    SpiralView.prototype.sortNewSpiral = function(){

        if (this.streamingID != null){

            var surfaceZero = this.surfaces.splice(0, 1);

            var songZero = this.songInfoArray.splice(0, 1);

        }

        this.surfaces.sort(function(a,b) {

            if (a.voteCount==b.voteCount){

                return (a.uploadTime > b.uploadTime) ? 1 : ((b.uploadTime > a.uploadTime) ? -1 : 0);

            }

            else {

                return (a.voteCount < b.voteCount) ? 1 : ((b.voteCount < a.voteCount) ? -1 : 0);

            }
        });

        this.songInfoArray.sort(function(a,b) {

            if (a.voteCount==b.voteCount){

                return (a.uploadTime > b.uploadTime) ? 1 : ((b.uploadTime > a.uploadTime) ? -1 : 0);

            }

            else {

                return (a.voteCount < b.voteCount) ? 1 : ((b.voteCount < a.voteCount) ? -1 : 0);

            }
        });  

        if (this.streamingID != null){

            this.surfaces.unshift(surfaceZero[0]);

            this.songInfoArray.unshift(songZero[0]);

        }

        this.rebuildSpiralComponents();

    };


    SpiralView.prototype.rebuildSpiralComponents = function(){

        this.tempArray = [];

        for (var i=0; i<this.surfaces.length; i++){

            this.newSongTile = new SongView([0.1796*this.options.size[0], 0.108*this.options.size[1]]);

            this.newSongTile.votePosition = this.surfaces[i].votePosition;

            this.newSongTile.voteCount = this.surfaces[i].voteCount;

            this.newSongTile.uploadTime = this.surfaces[i].uploadTime;

            this.newSongTile.songArt.setContent(this.songInfoArray[i].coverArt);

            this.newSongTile.rootModifier.setOpacity(1);

            if (!this.zoomed){

                this.newSongTile.rootModifier.setOpacity(0);
            }

            this.tempArray.push(this.newSongTile);

            if (this.tempArray.length==this.surfaces.length){

                this.popSpiral();

            }

        }

    };


    SpiralView.prototype.popSpiral = function(){

        if (this.surfaces.length==0){

            this.makeNewSpiral();
        }

        else {

            this.surfaces.pop();

            this.popSpiral();
        }

    };


    SpiralView.prototype.makeNewSpiral = function(){

        var count = 0;

        this.pushNewSong(count);

    };


    SpiralView.prototype.pushNewSong = function(count){

        this.tempArray[count].on('clickedSong', this.checkIfZoomed.bind(this, count));

        this.surfaces.push(this.tempArray[count]);

        this.checkIfPushedSongExists(count);

    };


    SpiralView.prototype.checkIfPushedSongExists = function(count){

        if (this.surfaces[count]){

            this.checkIfNeedtoAddHighlight(count);

            if (count == this.tempArray.length-1){

                if (this.queueNumber==this.activeQueueIndex){

                    this.playingQueue = this.songInfoArray;
                }

                if (this.zoomed){

                    this.switchSongContent();
                }

                this.rezeroTempArray();
            }

            else {

                count++;

                this.pushNewSong(count);
            }    

        }
        else{

            setTimeout(this.checkIfPushedSongExists.bind(this, count), 50);
        }

    };

    SpiralView.prototype.checkIfNeedtoAddHighlight = function(count) {

        if (count == 0 && this.streamingID != null){

            this.addHighlight();

        }

        if (this.songInfoArray[count].link == this.songVotedOnLink){

            this.addFlashingHighlight(count);
        }

    };


    SpiralView.prototype.rezeroTempArray = function(){

        this.songVotedOnLink = null;

        if (this.tempArray.length==0){

            this.spiralChangeLock = false;

            return;

        }

        else {

            this.tempArray.pop();

            this.rezeroTempArray();
        }

    };


    SpiralView.prototype.checkIfYouCanRoll = function(rollParam){

        this.rollingPlay(rollParam);

    };


    SpiralView.prototype.rollingPlay = function(rollParam){

        var that = this;

        if (rollParam == 'yes'){

            if (!this.rollLock){

                this.rollLock = true;

                this.finishUpRoll(rollParam);

                setTimeout(function(){

                    that.rollLock = false;

                }, 1000);
            }
        }
        else {

            this.rollLock = false;

            this.finishUpRoll(rollParam);
        }

    };

    SpiralView.prototype.finishUpRoll = function(rollParam){

        var songToRemove;
        var cont = true;

        // you are streaming from the queue you are currently in
        if (this.streamingID == this.userID){

            songToRemove = this.songInfoArray[0].link;

            if (this.songInfoArray.length == 1){

                this.surfaces.pop();

                this.songInfoArray = [];

                this._eventOutput.emit('tellFriendsAllSongsAreGone');

                this._eventOutput.emit('stopStream');

                cont = false;
            }
            else {

                this.songToPlayNext = this.songInfoArray[1];

                this.currentSongLink = this.songInfoArray[1].link;

                this.surfaces.shift();

                this.songInfoArray.shift();

                this.rebuildSpiralComponents();
            }

        }
        else {

            songToRemove = this.playingQueue[0].link;

            if (this.playingQueue.length == 1){

                this.playingQueue = [];

                this._eventOutput.emit('tellFriendsAllSongsAreGone');

                this._eventOutput.emit('stopStream');

                this.spiralChangeLock = false;

                cont = false;

            }
            else {

                this.songToPlayNext = this.playingQueue[1];

                this.currentSongLink = this.playingQueue[1].link;

                this.playingQueue.splice(0, 1);

                this.spiralChangeLock = false;
            }

        }

        if (cont){

            var minuteCount;
            var secondCount;
            var totalCount;            
            var duration = this.songToPlayNext.duration;

            if (duration.length == 4){
                minuteCount = Number(duration.charAt(0));
                if (duration.charAt(2)=='0'){
                    secondCount = Number(duration.charAt(3));
                }
                else {
                    secondCount = Number(duration.charAt(2) + duration.charAt(3));
                }
                totalCount = (minuteCount*60)+secondCount;
            }

            // > 10 min song
            else {
                minuteCount = Number(duration.charAt(0) + duration.charAt(1));
                if (duration.charAt(3)=='0'){
                    secondCount = Number(duration.charAt(4));
                }
                else {
                    secondCount = Number(duration.charAt(3) + duration.charAt(4));
                }
                totalCount = (minuteCount*60)+secondCount;

            }
            var sendObj = {

                songLink: this.currentSongLink,

                songName: this.songToPlayNext.track,

                songArtist: this.songToPlayNext.artist,

                songDuration: totalCount,

                humanDuration: this.songToPlayNext.duration,

                queueID: this.currentQueueID,

                addedBy: this.songToPlayNext.posterName,

                remove: songToRemove,

                rolling: rollParam

            };


            if (window.webkit){

                window.webkit.messageHandlers.playSelected.postMessage(sendObj);
            }
            else{

                window.location = "toolbar://playSelected/songLink:" + this.currentSongLink + ",songName:" + sendObj.songName + ",songArtist:" + sendObj.songArtist + ",songDuration:" + sendObj.songDuration + ",humanDuration:" + sendObj.humanDuration + ",addedBy:" + sendObj.addedBy + ",queueID:" + sendObj.queueID + ",remove:" + sendObj.remove + ",rolling:"+sendObj.rolling;
            }

            var otherObj = {

                songToPlayNext: this.currentSongLink,

                remove: songToRemove

            };

            this._eventOutput.emit('tellFriendsToRoll', otherObj);
        }

    };


    SpiralView.prototype.resortPlayingQueue = function(){

        var songZero = this.playingQueue.splice(0, 1);

        this.playingQueue.sort(function(a,b) {

            if (a.voteCount==b.voteCount){

                return (a.uploadTime > b.uploadTime) ? 1 : ((b.uploadTime > a.uploadTime) ? -1 : 0);

            }

            else {

                return (a.voteCount < b.voteCount) ? 1 : ((b.voteCount < a.voteCount) ? -1 : 0);

            }
        });  

        this.playingQueue.unshift(songZero[0]);

        this.spiralChangeLock = false;

    };

    SpiralView.DEFAULT_OPTIONS = {
        memberLightboxOpts: {
            inTransition: spring,
            inOpacity: 1,
            outOpacity: 0,
            outTransition: spring
        }          
    };

//----------------Helper functions----------------------------------


    function _createScrollview (){

        this.scrollview = new Scrollview({margin: 2000, direction: 0, speedLimit: 3.0});

        this.surfaces = [];

        this.scrollview.sequenceFrom(this.surfaces);
        
        Engine.pipe(this.scrollview);

        this.modifier = new StateModifier({
            size: [0.1796*this.options.size[0], 0.1057*this.options.size[1]],
        });
            // 6-plus
        if (this.options.size[0]>400){

            this.modifier.setTransform(Transform.translate(3, 0, 20));  
        }

        // 6
        else if (this.options.size[0] < 400 && this.options.size[0] > 350){

            this.modifier.setTransform(Transform.translate(3, 0, 20));  

        }
        // 5
        else {

            this.modifier.setTransform(Transform.translate(-2, 0, -10));  
        }

        this.mainNode.add(this.modifier).add(this.scrollview);

        this.scrollview.outputFrom(function(offset) {

            this.calculateAbsolutePos();

            // 6-plus
            if (this.options.size[0]>400){

                return Transform.moveThen([0, 0.24*offset, 250], Transform.rotateY(0.005*offset));  
            }

            // 6
            else if (this.options.size[0] < 400 && this.options.size[0] > 350){

                return Transform.moveThen([0, 0.245*offset, 240], Transform.rotateY(0.0055*offset));  

            }
            // 5
            else {

                return Transform.moveThen([0, 0.25*offset, 230], Transform.rotateY(0.006*offset));  
            }

        }.bind(this));

    };



    function _addPlaylistNameTab (){

        this.playlistNameTab = new Surface({

            size: [0.8*this.options.size[0], true], 
            properties: {
                color: 'rgba(180,180,180,1)',
                textAlign: 'center',
                lineHeight: (0.04*this.options.size[1])+'px',
                fontSize: (0.025*this.options.size[1])+'px',
                fontFamily: 'HelveticaNeue',
                // fontWeight: 500,
                whiteSpace: 'nowrap'                     
            }
        });

        this.playlistNameTabModifier = new StateModifier({
            origin: [0.5, 0],
            align: [0.5, 0],
            transform: Transform.moveThen([0, 0.205*this.options.size[1], -200], Transform.rotateY(0.11)),
        });

        this.mainNode.add(this.playlistNameTabModifier).add(this.playlistNameTab);
    }



    function _addRemoveLockHandler(){

        var that = this;

        window.removeClickLock = function(){

            setTimeout(function(){

                that.clickLock = false;

            }, 200);
        };
    }


    function _addInfoLightbox () {

        this.infoLightbox = new Lightbox();

        this.infoSlides = [];

        this.infoLightbox.setOptions({inTransition: {duration: 650}, outTransition: {duration: 550}, inTransform: Transform.translate(0, 0, 0), outTransform: Transform.translate(0, 0, 0), overlap: false, outOpacity: 0, inOpacity: 1});

        this.mainNode.add(this.infoLightbox);

    }


    function _addSongInfoView(){

        this.songInfoView = new SongInfoView(this.options.size);

        this.infoSlides.push(this.songInfoView);
   
    }


    function _addObjCHandlers(){

        var that = this;

        window.getNextTrack = function(){

            that.checkIfYouCanRoll('yes');
        }

        window.playNext = function(){

            that.checkIfYouCanRoll('no');
        }
    }


    module.exports = SpiralView;


});




