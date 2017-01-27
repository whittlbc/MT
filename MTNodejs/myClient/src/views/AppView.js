 






/*

playingQueue --> songs

songInfoArray --> songs

playingQueueID --> id of queue you are streaming

currentQueueID --> id of queue you currently have open in webview

streamingID --> id of streamer of the current queue you have open

*/




define(function(require, exports, module) {

    var Pubnub = require('pubnub/PUBNUB');

//-------------Famo.us Stuff------------------------------    
    var Engine = require('famous/core/Engine');
    var View = require('famous/core/View');
    var Surface = require('famous/core/Surface');
    var Transform = require('famous/core/Transform');
    var StateModifier = require('famous/modifiers/StateModifier');
    var ImageSurface = require('famous/surfaces/ImageSurface');
    var Lightbox = require('famous/views/Lightbox');
    var Easing = require('famous/transitions/Easing');
    var Transitionable = require('famous/transitions/Transitionable');
    var SpringTransition = require('famous/transitions/SpringTransition');
    var SnapTransition = require("famous/transitions/SnapTransition");
    Transitionable.registerMethod('spring', SpringTransition);
    Transitionable.registerMethod('spring2', SpringTransition);
    Transitionable.registerMethod('spiralSpring', SpringTransition);
    Transitionable.registerMethod('settingsSpring', SpringTransition);
    Transitionable.registerMethod('dropDownSpring', SpringTransition);

//-----------Custom Views---------------------------------

    var SpiralView = require('views/SpiralView');
    var NoSongsView = require('views/NoSongsView');
    var SongView = require('views/SongView');

//--------------------------------------------------------

    var spring = {
        method: 'spring',
        period: 100,
        dampingRatio: 0.2
    };    

    var spring2 = {
        method: 'spring2',
        period: 500,
        dampingRatio: 0.8
    };        
    
    var spiralSpring = {
        method: 'spiralSpring',
        period: 200,
        dampingRatio: 0.625
    };


    var settingsSpring = {
        method: 'settingsSpring',
        period: 350,
        dampingRatio: 0.9
    };

    var dropDownSpring = {
        method: 'dropDownSpring',
        period: 300,
        dampingRatio: 0.6
    };

    function AppView(size) {

        View.apply(this, arguments);

        this.options.size = size;    

        this.testCount = 0;

        this.noContentsShown = false;

        this.queuesStreamed = [];

        this.leavingQueue = false;

        this.firstQueueCount = 0;

        this.activeQueueIndex = null;

        this.spiralShown = false;

        this.zoomOutLock = false;

        this.queueJustRestored = null;

        this.clickCount = 0;

        this.currentIndex = null;

        this.pushCount = 0;

        this.showSpiralCount = 0;

        this.currentQueueID = null;

        this.myPopupQueue = [];

        this.lastQueueViewed = null;

        this.coverArtReady = false;

        this.rootModifier = new StateModifier({
            size: this.options.size,
            origin: [0.5, 0.5],
            align: [0.5, 0.5]
        });

        this.mainNode = this.add(this.rootModifier);

        _initPubnub.call(this);
        _createBackgroundView.call(this);
        _createLightbox.call(this);
        _addSpiralView.call(this);
        _addNoSongsView.call(this);
        _addObjCHandlers.call(this);
        _createListeners.call(this);

    }

    AppView.prototype = Object.create(View.prototype);
    AppView.prototype.constructor = AppView;


    AppView.prototype.spinSpiralToTop = function(){

        this.spiralView.scrollview.setPosition(-4000);

    }

    AppView.prototype.getGroupMembersForLeavingMessage = function(obj){

        var that = this;

        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function(){

            if (xhr.readyState==4 && xhr.status == 200){

                that.groupMembersIDsForLeavingMessage= [];

                that.groupMembersIDsForLeavingMessagePlusMe = JSON.parse(xhr.responseText);

                that.groupMembersIDsForLeavingMessagePlusMe.map(function(user){

                    if (user.userID==that.userID){

                    } 

                    else {

                        that.groupMembersIDsForLeavingMessage.push(user.userID);
                    }

                });

                that.sendLeavingMessage(obj);

            }
        };  

        xhr.open('post', '/users/getGroupMembers', true); 

        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.send(JSON.stringify(obj));        

    };


    AppView.prototype.sendLeavingMessage = function(obj){

        var that = this;

        for (var i=0; i<this.groupMembersIDsForLeavingMessage.length; i++){

            this.pubnub.publish({

                channel: that.groupMembersIDsForLeavingMessage[i] + 'LeavingAppAsStreamer',

                message: obj

            });

        }

    };


    AppView.prototype.sendUpdateVoteCountMessage = function(obj){

        var that = this;

        for (var i=0; i<this.groupMembersIDsForUpdateMessage.length; i++){

            this.pubnub.publish({

                channel: that.groupMembersIDsForUpdateMessage[i] + 'UpdateVoteCount',

                message: obj

            });

        }

    };

    // AppView.prototype.subscribePubNub = function(){

    //     var that = this;

    //     this.pubnub.subscribe({

    //         channel: this.userID + 'Invitation',

    //         callback: function(m){

    //             // that.latestPopupMessage = m.wholeThing;

    //             // that.popupNewInvitationView.phraseSurface.setContent(m.senderName + m.messageContent + m.queueName);

    //             // that.invitedQueueName = m.queueName;

    //             // that.invitedQueueID = m.queueID;

    //             // that.invitedQueuePrivacy = m.privacy;

    //             // that.senderID = m.senderID;

    //             // that.currentIndex2 = 8;

    //             // if (that.spiralView.zoomed){

    //             //     that.zoomSpiralOut();

    //             //     setTimeout(function(){

    //             //         that.showCurrentSlide2(messageSpring);
                    
    //             //     }, 650);

    //             // }
    //             // else {

    //             //     that.showCurrentSlide2(messageSpring);
    //             // }

    //             // that.popupNewInvitationViewShown = true;
    //         }
            
    //     });

    //     this.pubnub.subscribe({

    //         channel: this.userID + 'InvitationResponse',

    //         callback: function(m){

    //             // that.latestPopupMessage = m.wholeThing;

    //             // that.popupInvitationAcceptedView.phraseSurface.setContent(m.senderName + m.messageContent + m.queueName);              

    //             // that.currentIndex2 = 4;

    //             // if (that.spiralView.zoomed){

    //             //     that.zoomSpiralOut();

    //             //     setTimeout(function(){

    //             //         that.showCurrentSlide2(messageSpring);
                    
    //             //     }, 650);

    //             // }
    //             // else {

    //             //     that.showCurrentSlide2(messageSpring);
    //             // }

    //             // if (m.queueID == that.currentQueueID && (that.spiralShown || that.noContentsShown)){

    //             //     that.findGroupMembers();
    //             // }
    //         }
            
    //     });   

    //     this.pubnub.subscribe({

    //         channel: this.userID + 'Request',

    //         callback: function(m){

    //             // that.latestPopupMessage = m.wholeThing;

    //             // that.popupNewRequestView.phraseSurface.setContent(m.senderName + m.messageContent + m.queueName); 

    //             // that.requestedQueueName = m.queueName;

    //             // that.requestedQueueID = m.queueID;

    //             // that.requestedFriendID = m.friendID;

    //             // that.currentIndex2 = 9;

    //             // if (that.spiralView.zoomed){

    //             //     that.zoomSpiralOut();

    //             //     setTimeout(function(){

    //             //         that.showCurrentSlide2(messageSpring);
                    
    //             //     }, 650);

    //             // }
    //             // else {

    //             //     that.showCurrentSlide2(messageSpring);
    //             // }

    //             // that.popupNewRequestViewShown = true;

    //         }
            
    //     });

    //     this.pubnub.subscribe({

    //         channel: this.userID + 'RequestResponse',

    //         callback: function(m){

    //             // that.latestPopupMessage = m.wholeThing;

    //             // that.popupRequestAcceptedView.phraseSurface.setContent(m.senderName + m.messageContent + m.queueName);                

    //             // that.requestedQueueName = m.queueName;

    //             // that.requestedQueueID = m.queueID;

    //             // that.callbackUserID = m.acceptorID;

    //             // that.currentIndex2 = 5;

    //             // if (that.spiralView.zoomed){

    //             //     that.zoomSpiralOut();

    //             //     setTimeout(function(){

    //             //         that.showCurrentSlide2(messageSpring);
                    
    //             //     }, 650);

    //             // }
    //             // else {

    //             //     that.showCurrentSlide2(messageSpring);
    //             // }               
                
    //             // that.popupRequestAcceptedViewShown = true;

    //         }
            
    //     });    


    //     // YOU DON'T USE THIS ANYMORE
    //     this.pubnub.subscribe({

    //         channel: this.userID + 'DoubleResponse',

    //         callback: function(m){

    //         }
            
    //     });       
   

    //     this.pubnub.subscribe({

    //         channel: this.userID + 'AllSongsAreGone',

    //         callback: function(obj){

    //             var queueID = obj.queueID;

    //             if (that.spiralShown && that.currentQueueID == queueID){

    //                 that.spiralView.surfaces.shift();

    //                 that.lightbox.setOptions({inTransform: Transform.translate(0, 0, 0), outTransform: Transform.translate(0, 0, 0), overlap: false, outOpacity: 0, inOpacity: 0});

    //                 that.lightbox.show(that.slides[1], {duration: 500});

    //                 that.spiralShown = false;
    //             }

    //         }
            
    //     });  

    //     this.pubnub.subscribe({

    //         channel: this.userID + 'RegrabTastePoints',

    //         callback: function(obj){

    //             var points = obj.taste;
    //         }
            
    //     });  

    //     this.pubnub.subscribe({

    //         channel: this.userID + 'SwitchToSpiral',

    //         callback: function(queueID){

    //             if (that.currentIndex == 1 && that.currentQueueID == obj.queueID){

    //                 that.getTracksFromDB();
    //             }            
    //         }
            
    //     });  

    //     this.pubnub.subscribe({

    //         channel: this.userID + 'RegrabMessages',

    //         callback: function(messages){

    //             // that.missedMessages = messages;

    //             // that.messagesLength = that.missedMessages.length;

    //             // if (that.missedMessages.length==0){

    //             //     that.sideUserView.messagesNumberModifier.setOpacity(0);

    //             //     that.hamburgerBtn.messagesNumberModifier.setOpacity(0);
    //             // }
    //             // else {

    //             //     if (that.missedMessages.length >= 10){

    //             //         that.sideUserView.messagesNumber.setSize([0.11244*that.options.size[1], 0.089955*that.options.size[1]]);

    //             //         that.sideUserView.messagesNumberModifier.setTransform(Transform.translate(0.52933*that.options.size[0], 0.32684*that.options.size[1], -601));

    //             //         that.hamburgerBtn.messagesNumber.setSize([0.03898*that.options.size[1], 0.029985*that.options.size[1]]);

    //             //     }
                        
    //             //     that.sideUserView.messagesNumber.setContent(that.missedMessages.length.toString());
                    
    //             //     that.hamburgerBtn.messagesNumber.setContent(that.missedMessages.length.toString());

    //             //     that.sideUserView.messagesNumberModifier.setOpacity(1);

    //             //     that.hamburgerBtn.messagesNumberModifier.setOpacity(1);

    //             // }

    //             // for (var i=0; i<that.notificationsView.surfaces.length; i++){

    //             //     that.notificationsView.surfaces.pop();
    //             // }

    //             // if (that.missedMessages.length > 0){

    //             //     that.getFriendsProfPics(0, that.missedMessages);
    //             // }

    //         }
            
    //     });       


    //     this.pubnub.subscribe({
 
    //         channel: this.userID + 'UpdateQueue',

    //         callback: function(songMessage){

    //             that.checkIfCanAddSong(songMessage);

    //         }
            
    //     });       


    //     // this.pubnub.subscribe({
 
    //     //     channel: this.userID + 'RePushSpiral',

    //     //     callback: function(obj){

    //     //         if (that.spiralShown && that.currentQueueID == obj.queueID){

    //     //             that.checkIfYouCanRefreshSpiral(obj);

    //     //         }
    //     //         else if (that.currentIndex == 1 && that.currentQueueID == obj.queueID){

    //     //             that.getTracksFromDB();
    //     //         }
    //     //         else {

    //     //             if (that.spiralView.playingQueueID == obj.queueID){

    //     //                 that.checkIfYouCanUpdateArrays(obj);

    //     //             }                
    //     //         }

    //     //     }
            
    //     // });       


    //     this.pubnub.subscribe({
 
    //         channel: this.userID + 'JustUpdateArrays',

    //         callback: function(obj){

    //             if (that.spiralView.playingQueueID == obj.queueID){

    //                 that.checkIfYouCanUpdateArrays(obj);

    //             }

    //         }
            
    //     });       


    //     this.pubnub.subscribe({
 
    //         channel: this.userID + 'ActiveAgain',

    //         callback: function(m){

    //             if (that.spiralShown){

    //                 that.rePushSpiral(null, true);

    //             }

    //         }
            
    //     });
  

    //     this.pubnub.subscribe({
 
    //         channel: this.userID + 'ChangeOrderMessage',

    //         callback: function(obj){

    //             if (that.spiralShown){

    //                 if (that.currentQueueID == obj.id){

    //                     that.friendSaidChangeOrder(obj);

    //                 }

    //             }

    //             else {

    //                 if (that.spiralView.playingQueueID == obj.id){

    //                     for (var i = 0; i < that.spiralView.playingQueue.length; i++){

    //                         if (that.spiralView.playingQueue[i].link == obj.songLink){

    //                             var first = that.spiralView.playingQueue.splice(i, 1);

    //                         }
    //                     }

    //                     var last = that.spiralView.playingQueue.splice(0, 1);

    //                     last[0].uploadTime = obj.newUploadTime;
    //                     last[0].voteCount = 0;

    //                     that.spiralView.playingQueue.unshift(first[0]);

    //                     that.spiralView.playingQueue.push(last[0]);                            

    //                     that.playingQueue = that.spiralView.playingQueue;                  
    //                 }

    //             }              
    //         }
            
    //     }); 


    //     this.pubnub.subscribe({
 
    //         channel: this.userID + 'UpdateTastePoints',

    //         callback: function(obj){

    //             // var newTastePointsCount = that.tastePoints + obj.direction;

    //             // that.sideUserView.yourPointsNumber.setContent(newTastePointsCount.toString());

    //             // that.tastePoints = newTastePointsCount;
    //         }

    //     });

    //     this.pubnub.subscribe({
 
    //         channel: this.userID + 'ImStreamingMessage',

    //         callback: function(obj){

    //             if (that.spiralShown && that.currentQueueID==obj.id){

    //                 that.spiralView.streamLock = true;

    //                 that.spiralView.streamingID = obj.streamingID;

    //                 that.spiralView.streamingName = obj.streamingName;

    //                 that.spiralView.addHighlight();

    //                 var streamerName = that.spiralView.streamingName;

    //                 if (streamerName.length > 20){

    //                     var lastInitial = streamerName.slice(streamerName.indexOf(' ')+1, streamerName.indexOf(' ')+2);

    //                     streamerName = streamerName.slice(0, streamerName.indexOf(' ')+1)+lastInitial+'.';
    //                 }

    //                 that.spiralView.playlistNameTab.setContent("( "+streamerName+" )");

    //             }

    //         }
            
    //     });  


    //     this.pubnub.subscribe({
 
    //         channel: this.userID + 'LeavingAppAsStreamerFromTimeout',

    //         callback: function(obj){

    //             if (that.spiralShown && that.currentQueueID==obj.queueID && that.userID != obj.userID){

    //                 that.spiralView.streamLock = false;

    //                 that.spiralView.streamingID = null;

    //                 that.spiralView.sortNewSpiral();

    //                 that.spiralView.streamingName = null;

    //                 that.spiralView.removeHighlight();

    //                 that.spiralView.playlistNameTab.setContent(" ");
    //             }

    //             else if (that.userID == obj.userID){

    //                 if (that.spiralShown){

    //                     if (that.currentQueueID == that.spiralView.playingQueueID){

    //                         that.spiralView.playlistNameTab.setContent(" ");
    //                     }

    //                 }

    //                 else {

    //                 }

    //                 that.stopEffectsForFormerStreamer();

    //             }
    //             else {


    //             }

    //         }
            
    //     });  

    //     this.pubnub.subscribe({
 
    //         channel: this.userID + 'LeavingAppAsStreamer',

    //         callback: function(obj){

    //             if (that.spiralShown && that.currentQueueID==obj.queueID){

    //                 that.spiralView.streamLock = false;

    //                 that.spiralView.streamingID = null;

    //                 that.spiralView.sortNewSpiral();

    //                 that.spiralView.streamingName = null;

    //                 that.spiralView.removeHighlight();

    //                 that.spiralView.playlistNameTab.setContent(" ");

    //             }

    //         }
            
    //     });  

    //     this.pubnub.subscribe({
 
    //         channel: this.userID + 'RollUpdate',

    //         callback: function(obj){

    //             that.friendSaidRoll(obj);

    //         }
            
    //     });


    //     this.pubnub.subscribe({
 
    //         channel: this.userID + 'UpdateVoteCount',

    //         callback: function(infoObj){

    //             if (that.spiralShown && that.currentQueueID == infoObj.queueID){

    //                 that.friendToldMeToUpdateVoteCountInsideQueue(infoObj);

    //             }

    //             else {

    //                 if (that.spiralView.playingQueueID == infoObj.queueID){

    //                     that.friendToldMeToUpdateVoteCountOutsideQueue(infoObj);

    //                 }

    //             }

    //         }
            
    //     });   

    // };


    AppView.prototype.checkIfYouCanRefreshSpiral = function(obj){

        if (!this.spiralView.spiralChangeLock){

            this.spiralView.spiralChangeLock = true;

            this.rePushSpiral(obj, false);
        }
        else{

            setTimeout(this.checkIfYouCanRefreshSpiral.bind(this, obj), 50);
        }

    };


    AppView.prototype.checkIfYouCanUpdateArrays = function(obj){

        if (!this.spiralView.spiralChangeLock){

            this.spiralView.spiralChangeLock = true;

            this.regrabSongsForPlayingQueue(obj);
        
        }
        else{

            setTimeout(this.checkIfYouCanUpdateArrays.bind(this, obj), 100);
        }

    };


    AppView.prototype.regrabSongsForPlayingQueue = function(obj) {

        var that = this;

        var sendObj = {

            id: obj.queueID
        };

        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function(){

            if (xhr.readyState==4 && xhr.status == 200){

                var response = JSON.parse(xhr.responseText);

                for (var i = 0; i < response.songs.length; i++){

                    if (response.songs[i].link == response.playingSong){

                        if (that.spiralShown && that.currentQueueID == obj.queueID){

                            that.updateArrays(i, response.songs, true);

                        }
                        else{

                            that.updateArrays(i, response.songs, false);
                        }

                        break;                
                    }
                }
            }
        };

        xhr.open('post', '/users/getTracksFromDB', false); 

        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.send(JSON.stringify(sendObj));      

    };


    AppView.prototype.updateArrays = function(i, songs, songInfoArray) {

        var songZero = songs.splice(i, 1);

        songs.sort(function(a,b) {

            if (a.voteCount==b.voteCount){

                return (a.uploadTime > b.uploadTime) ? 1 : ((b.uploadTime > a.uploadTime) ? -1 : 0);

            }

            else {

                return (a.voteCount < b.voteCount) ? 1 : ((b.voteCount < a.voteCount) ? -1 : 0);

            }
        });  

        songs.unshift(songZero[0]);

        this.playingQueue = songs;

        this.spiralView.playingQueue = songs;

        if (songInfoArray){

            this.spiralView.songInfoArray = songs;
        }

        this.spiralView.spiralChangeLock = false;

    };


    AppView.prototype.checkIfCanAddSong = function(songMessage){

        if (!this.spiralView.spiralChangeLock){

            this.spiralView.spiralChangeLock = true;

            // You are inside of a queue
            if (this.spiralShown){

                // The queue that you are currently in is the one that was just updated
                if (this.currentQueueID == songMessage.queueID){

                    this.getArtForThisTrack(songMessage.newTrack.link, songMessage.newTrack);

                    // You are the streamer of the queue that was just updated
                    if (this.spiralView.playingQueueID == songMessage.queueID){
                        
                        this.spiralView.playingQueue.push(songMessage.newTrack);
                    }

                }

                // I'm inside of a queue, but not the one that was just updated
                else {

                    // You are the streamer of the queue that was just updated
                    if (this.spiralView.playingQueueID == songMessage.queueID){

                        this.spiralView.playingQueue.push(songMessage.newTrack);
                    }

                    this.spiralView.spiralChangeLock = false;

                }

            }
            else {

                // You are the streamer of this queue
                if (this.spiralView.playingQueueID == songMessage.queueID){

                    this.spiralView.playingQueue.push(songMessage.newTrack);
                }

                this.spiralView.spiralChangeLock = false;

            }

        }
        else {

            setTimeout(this.checkIfCanAddSong.bind(this, songMessage), 300);
        }

    }


    AppView.prototype.friendSaidRoll = function(obj){

        if (!this.spiralView.spiralChangeLock){

            if (this.spiralShown && this.currentQueueID==obj.id){

                this.spiralView.spiralChangeLock = true;

                var surfaceZero = this.spiralView.surfaces.splice(0, 1);

                surfaceZero[0].votePosition = 0;
                surfaceZero[0].voteCount = 0;
                surfaceZero[0].uploadTime = obj.newUploadTime;

                var songZero = this.spiralView.songInfoArray.splice(0, 1);
              
                songZero[0].uploadTime = surfaceZero[0].uploadTime;
                songZero[0].voteCount = 0;

                this.spiralView.surfaces.sort(function(a,b) {

                    if (a.voteCount==b.voteCount){

                        return (a.uploadTime > b.uploadTime) ? 1 : ((b.uploadTime > a.uploadTime) ? -1 : 0);

                    }

                    else {

                        return (a.voteCount < b.voteCount) ? 1 : ((b.voteCount < a.voteCount) ? -1 : 0);

                    }
                });

                this.spiralView.songInfoArray.sort(function(a,b) {

                    if (a.voteCount==b.voteCount){

                        return (a.uploadTime > b.uploadTime) ? 1 : ((b.uploadTime > a.uploadTime) ? -1 : 0);

                    }

                    else {

                        return (a.voteCount < b.voteCount) ? 1 : ((b.voteCount < a.voteCount) ? -1 : 0);

                    }
                });  

                this.spiralView.surfaces.push(surfaceZero[0]);

                this.spiralView.songInfoArray.push(songZero[0]);

                this.spiralView.rebuildSpiralComponents();

            }

        }
        else {

            setTimeout(this.friendSaidRoll.bind(this, obj), 100);
        }

    };



    AppView.prototype.friendSaidChangeOrder = function(obj){

        this.testCount++;

        if (!this.spiralView.spiralChangeLock){

            this.spiralView.spiralChangeLock = true;  

            for (var i = 0; i < this.spiralView.songInfoArray.length; i++){

                if (this.spiralView.songInfoArray[i].link == obj.songLink){

                    this.finishChangingOrder(obj, i);

                    break;
                }

            }          
        }

        else {

            setTimeout(this.friendSaidChangeOrder.bind(this, obj), 200);
        }

    };


    AppView.prototype.finishChangingOrder = function(obj, i){

        var surfaceZero = this.spiralView.surfaces.splice(i, 1);

        var songZero = this.spiralView.songInfoArray.splice(i, 1);

        var surfaceLast = this.spiralView.surfaces.splice(0, 1);

        var songLast = this.spiralView.songInfoArray.splice(0, 1);

        surfaceLast[0].votePosition = 0;
        surfaceLast[0].voteCount = 0;
        surfaceLast[0].uploadTime = obj.newUploadTime;
        songLast[0].uploadTime = obj.newUploadTime;
        songLast[0].voteCount = 0;

        this.spiralView.surfaces.unshift(surfaceZero[0]);

        this.spiralView.songInfoArray.unshift(songZero[0]);

        this.spiralView.surfaces.push(surfaceLast[0]);

        this.spiralView.songInfoArray.push(songLast[0]);                        

        this.spiralView.rebuildSpiralComponents();

        this.spiralView.addHighlight();

    };


    AppView.prototype.friendToldMeToUpdateVoteCountInsideQueue = function(infoObj){

        if (!this.spiralView.spiralChangeLock){

            this.spiralView.spiralChangeLock = true;

            this.spiralView.updateSongInfoArray(infoObj.songIndex, infoObj.changeBy, infoObj.newUploadTime);

            this.spiralView.updateSongTile(infoObj.songIndex, infoObj.changeBy, false);

            if (infoObj.songIndex == 0){

                if (this.spiralView.streamingID == null){

                    this.spiralView.sortNewSpiral();
                }
                else {

                    this.spiralView.spiralChangeLock = false;
                }
            }
            else {

                this.spiralView.sortNewSpiral();
            }
        }
        else {

            setTimeout(this.friendToldMeToUpdateVoteCountInsideQueue.bind(this, infoObj), 200);
        }

    };


    AppView.prototype.friendToldMeToUpdateVoteCountOutsideQueue = function(infoObj){

        if (!this.spiralView.spiralChangeLock){

            this.spiralView.spiralChangeLock = true;        

            this.spiralView.playingQueue[infoObj.songIndex].voteCount = this.spiralView.playingQueue[infoObj.songIndex].voteCount + infoObj.changeBy;

            this.spiralView.playingQueue[infoObj.songIndex].uploadTime = infoObj.newUploadTime;

            this.spiralView.resortPlayingQueue();  

        }
        else {

            setTimeout(this.friendToldMeToUpdateVoteCountOutsideQueue.bind(this, infoObj), 200);
        }
    };


    AppView.prototype.rePushSpiral = function(obj, justEnteredForeground){

        // done popping off all old songs
        if (this.spiralView.surfaces.length == 0){

            this.trackList = [];

            this.spiralView.songInfoArray = [];

            this.songTitlesArray = [];

            this.voteCountArray = [];

            this.coverArtArray = [];

            this.justLinkArray = [];

            this.uploadTimeArray = [];

            if (justEnteredForeground){

                this.regrabSongs(this.currentQueueID, true);
            }
            else {

                this.playingSong = obj.playingSong;

                this.spiralView.streamingID = obj.streamingID;

                this.regrabSongs(obj.queueID, false);    
            } 
        }

        // just iterating through and popping off one at a time
        else {

            this.spiralView.surfaces.pop();

            this.rePushSpiral(obj, justEnteredForeground);
        }

    };


    AppView.prototype.regrabSongs = function(queueID, justEnteredForeground) {

        var that = this;

        var sendObj = {

            id: queueID
        };

        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function(){

            if (xhr.readyState==4 && xhr.status == 200){

                var response = JSON.parse(xhr.responseText);

                that.playingSong = response.playingSong;

                that.spiralView.streamingID = response.streamingID;                

                that.spiralView.streamingName = response.streamingName;     

                that.resortTheSongs(response.songs);

            }
        };

        xhr.open('post', '/users/getTracksFromDB', false); 

        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.send(JSON.stringify(sendObj));      

    };


    AppView.prototype.resortTheSongs = function(unsortedSongsArray){

        this.indexOfPlayingSong = null; 

        if (this.spiralView.streamingID != null){

            for (var i=0; i<unsortedSongsArray.length; i++){

                if (unsortedSongsArray[i].link == this.playingSong){

                    this.indexOfPlayingSong = i;

                    var songZero = unsortedSongsArray.splice(i, 1);

                    this.trackList = unsortedSongsArray.sort(function(a,b) {

                        if (a.voteCount==b.voteCount){

                            return (a.uploadTime > b.uploadTime) ? 1 : ((b.uploadTime > a.uploadTime) ? -1 : 0);

                        }
                        else {

                            return (a.voteCount < b.voteCount) ? 1 : ((b.voteCount < a.voteCount) ? -1 : 0);

                        }
                    });

                    this.trackList.unshift(songZero[0]);

                    this.pushTrackInfoToOtherArrays();

                }

            }

        }
        else {

            this.trackList = unsortedSongsArray.sort(function(a,b) {

                if (a.voteCount==b.voteCount){

                    return (a.uploadTime > b.uploadTime) ? 1 : ((b.uploadTime > a.uploadTime) ? -1 : 0);

                }
                else {

                    return (a.voteCount < b.voteCount) ? 1 : ((b.voteCount < a.voteCount) ? -1 : 0);

                }
            });

            this.pushTrackInfoToOtherArrays();

        }

    };


    // AppView.prototype.rePushTrackInfoToOtherArrays = function(){

    //     this.spiralView.songInfoArray = this.trackList;

    //     for (var i=0; i<this.trackList.length; i++){

    //         this.songTitlesArray.push(this.trackList[i].abbrevTrack);

    //         this.voteCountArray.push(Number(this.trackList[i].voteCount));

    //         this.uploadTimeArray.push(this.trackList[i].uploadTime);

    //         this.coverArtArray.push(this.trackList[i].coverArt);

    //         this.justLinkArray.push(this.trackList[i].link);

    //         if (i==this.trackList.length-1){

    //             this.resetSpiralContent(0);

    //         }
    //     }

    // };


    // AppView.prototype.resetSpiralContent = function(count){

    //     for (var n=0; n<this.trackList.length; n++){

    //         this.songView = new SongView([0.1796*this.options.size[0], 0.108*this.options.size[1]]);

    //         this.songTitleInstance = this.songTitlesArray[n];

    //         this.songView.voteCount = this.voteCountArray[n];

    //         this.songView.votePosition = 0;

    //         this.songView.uploadTime = this.uploadTimeArray[n];

    //         this.songView.songArt.setContent(this.coverArtArray[n]);

    //         this.spiralView.surfaces.push(this.songView);

    //         if (n==this.trackList.length-1){

    //             this.waitForPush();
    //         }

    //     }

    // };


    // AppView.prototype.getNewCoverArt = function(songView, count){

    //     var that = this;

    //     var sendObj = {

    //         songLink: this.trackList[count].link
    //     };

    //     var xhr = new XMLHttpRequest();

    //     xhr.onreadystatechange = function(){

    //         if (xhr.readyState==4 && xhr.status == 200){

    //             that.trackList[count].coverArt = xhr.responseText;

    //             songView.songArt.setContent(that.trackList[count].coverArt);

    //             that.spiralView.surfaces.push(songView);

    //             that.spiralView.addOneToListeners(count);

    //             that.checkIfAllArePushed(count);

    //             that.masterMap[that.trackList[count].link] = {coverArt: that.trackList[count].coverArt};

    //         }
    //     };

    //     xhr.open('post', '/users/getCoverArt', true); 

    //     xhr.setRequestHeader('Content-Type', 'application/json');

    //     xhr.send(JSON.stringify(sendObj));

    // };


    // AppView.prototype.checkIfAllArePushed = function(count){

    //     if (count == this.trackList.length-1){

    //         this.stillLoadingCoverArt = false;

    //         this.getPreviousVotes();

    //         if (this.spiralView.zoomed){

    //             for (var j = 0; j < this.spiralView.surfaces.length; j++){

    //                 this.spiralView.surfaces[j].rootModifier.setOpacity(1);
    //             }
    //         }

    //         this.reShowSpiralView();

    //     }
    //     else {

    //         count++;

    //         this.resetSpiralContent(count);

    //     }

    // };
    

    // AppView.prototype.reShowSpiralView = function(){

    //     var that = this;

    //     if (this.spiralView.streamingID == this.userID){

    //         this.spiralView.addHighlight(); 

    //         this.spiralView.playingQueue = this.spiralView.songInfoArray;

    //         this.playingQueue = this.spiralView.playingQueue; 

    //     }
    //     else if (this.spiralView.streamingID != this.userID && this.spiralView.streamingID != null){

    //         this.spiralView.addHighlight();  

    //     }
    //     else {

    //         this.spiralView.removeHighlight();

    //     }

    //     this.justLinkArray = [];

    //     for (var i = 0; i < this.spiralView.songInfoArray.length; i++){

    //         this.justLinkArray.push(this.spiralView.songInfoArray[i].link);
    //     }

    //     if (this.spiralView.zoomed){

    //         this.spiralView.switchSongContent();
    //     }

    //     this.spiralView.spiralChangeLock = false;

    // };
    

    AppView.prototype.stopEffectsForFormerStreamer = function(){

        // if (this.activeQueueIndex != null){

        //     this.j = Math.floor((this.activeQueueIndex+1)/3);

        //     this.k = (this.activeQueueIndex+1) % 3;  

        //     this.queueTileHasHighlight = false;

        // }

        this.spiralView.playing = false;

        this.spiralView.playCount = 0;

        this.firstQueueCount = 0;

        this.spiralView.firstQueueActivated = false;

        // this.activeQueueIndex = null;

        // this.spiralView.activeQueueIndex = null;

        this.spiralView.playingQueue = null;

        this.spiralView.streamingID = null;

        if (this.spiralShown){

            if (this.spiralView.surfaces.length > 0){

                if (this.currentQueueID == this.spiralView.playingQueueID){

                    this.spiralView.sortNewSpiral();

                    this.spiralView.removeHighlight();
                }
            }
        }

        this.spiralView.playingQueueID = null;
    };


    AppView.prototype.getArtForThisTrack = function(link, newTrack){

        // if (this.masterMap[link] && this.masterMap[link].coverArt != undefined){

        //     newTrack.coverArt = this.masterMap[link].coverArt;

        //     this.pushNewSongToCurrentSpiral(newTrack, true);
        // }
        // else {

        //     var that = this;

        //     var sendObj = {

        //         songLink: link
        //     };

        //     var xhr = new XMLHttpRequest();

        //     xhr.onreadystatechange = function(){

        //         if (xhr.readyState==4 && xhr.status == 200){

        //             newTrack.coverArt = xhr.responseText;

        //             that.pushNewSongToCurrentSpiral(newTrack, true);

        //             that.masterMap[link] = {coverArt: newTrack.coverArt};

        //         }
        //     };

        //     xhr.open('post', '/users/getCoverArt', true); 

        //     xhr.setRequestHeader('Content-Type', 'application/json');

        //     xhr.send(JSON.stringify(sendObj));
        // }

    };

    AppView.prototype.zoomSpiralIn = function(){

		this.spiralView.zoomIn();

    };


    AppView.prototype.zoomSpiralOut = function(){

        this.spiralView.zoomOut();
            
    };


    AppView.prototype.tellFriendsToUpdateVoteCount = function(obj){

        var that = this;

        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function(){

            if (xhr.readyState==4 && xhr.status == 200){

                that.groupMembersIDsForUpdateMessage= [];

                that.groupMembersForUpdateMessagePlusMe = JSON.parse(xhr.responseText);

                that.groupMembersForUpdateMessagePlusMe.map(function(user){

                    if (user.userID==that.userID){

                    } 

                    else {

                        that.groupMembersIDsForUpdateMessage.push(user.userID);
                    }

                });

                that.sendUpdateVoteCountMessage(obj);
            }
        };  

        xhr.open('post', '/users/getGroupMembers', true); 

        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.send(JSON.stringify(obj));        

    };


    AppView.prototype.sendUpdateVoteCountMessage = function(obj){

        var that = this;

        for (var i=0; i<this.groupMembersIDsForUpdateMessage.length; i++){

            this.pubnub.publish({

                channel: that.groupMembersIDsForUpdateMessage[i] + 'UpdateVoteCount',

                message: obj

            });

        }

    };


    AppView.prototype.updateDBVoteCount = function(obj){

        var sendObj = {

            userID: this.userID,

            id: this.currentQueueID,

            link: obj.songLink,

            newVoteCount: obj.newVoteCount,

            changeBy: obj.changeBy,

            newUploadTime: obj.newUploadTime

        };

        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function(){

            if (xhr.readyState==4 && xhr.status == 200){

                console.log(xhr.responseText);

            }
        };

        xhr.open('post', '/users/updateVoteCount', true); 

        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.send(JSON.stringify(sendObj));        

    };


    AppView.prototype.updateSongProperties = function(obj){

        var that = this;

        var sendObj = {

            userID: this.userID,

            id: this.spiralView.playingQueueID, 

            link: obj.songLink,

            newUploadTime: obj.newUploadTime,

            newPlayingSong: obj.newPlayingSong
        };

        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function(){

            if (xhr.readyState==4 && xhr.status == 200){

                console.log(xhr.responseText);
            }
        };

        xhr.open('post', '/users/updateSongProperties', true); 

        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.send(JSON.stringify(sendObj));        

    };


    AppView.prototype.updateLastTrack = function(obj){

        var that = this;

        var sendObj = {

            id: this.spiralView.playingQueueID, 

            link: obj.songLink,

            newUploadTime: obj.newUploadTime

        };

        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function(){

            if (xhr.readyState==4 && xhr.status == 200){

                console.log(xhr.responseText);
            }
        };

        xhr.open('post', '/users/updateLastTrack', true); 

        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.send(JSON.stringify(sendObj));        

    };



    AppView.prototype.setYourselfAsStreamer = function(songToPlay){

        this.tellFriendsAlreadyInQueue();

        var sendObj = {

            userID: this.userID,

            queueID: this.currentQueueID,

            songLink: songToPlay,

            myName: this.myName
        };

        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function(){

            if (xhr.readyState==4 && xhr.status == 200){

                console.log(xhr.responseText);
            }
        };

        xhr.open('post', '/users/setYourselfAsStreamer', true); 

        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.send(JSON.stringify(sendObj));  

    };


    AppView.prototype.tellFriendsToShiftPlayingOrder = function(sendObj){

        var that = this;

        var obj = {

            id: this.currentQueueID,

            firstSongLink: sendObj.firstSongLink,

            songToPlay: sendObj.songToPlay,

            streamingID: sendObj.streamingID,

            userID: this.userID
        };

        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function(){

            if (xhr.readyState==4 && xhr.status == 200){

                console.log(xhr.responseText);
            }
        };  

        xhr.open('post', '/users/findMembersForPlayOrderChangeMessage', true); 

        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.send(JSON.stringify(obj)); 

    };


    AppView.prototype.tellFriendsAlreadyInQueue = function(){

        var sendObj = {

            queueID: this.currentQueueID

        };

        var that = this;

        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function(){

            if (xhr.readyState==4 && xhr.status == 200){

                var membersPlusMe = JSON.parse(xhr.responseText);

                var otherMembersIDs = [];

                membersPlusMe.map(function(user){

                    if (user.userID==that.userID){


                    } 
                    else {

                        otherMembersIDs.push(user.userID);
                    }

                });

                that.sendImStreamingMessage(otherMembersIDs);

            }
        };  

        xhr.open('post', '/users/getGroupMembers', true); 

        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.send(JSON.stringify(sendObj)); 

    };


    AppView.prototype.sendImStreamingMessage = function(otherMembersIDs){

        var obj = {

            id: this.currentQueueID,

            streamingID: this.userID,

            streamingName: this.myName,

            playingSong: this.playingSong
        };

        for (var i=0; i<otherMembersIDs.length; i++){

            this.pubnub.publish({

                channel: otherMembersIDs[i] + 'ImStreamingMessage',

                message: obj

            });

        }

    };


    AppView.prototype.tellFriendsToRoll = function(obj){

        var queueInfoObj = {

            id: this.spiralView.playingQueueID,

            songToPlayNext: obj.songToPlayNext,

            songToRemove: obj.remove,

            userID: this.userID
        
        };

        var that = this;

        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function(){

            if (xhr.readyState==4 && xhr.status == 200){

                console.log("Successfully rolled");

            }
        };  

        xhr.open('post', '/users/findMembersForRollMessage', true); 

        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.send(JSON.stringify(queueInfoObj));           

    };


    // AppView.prototype.startDBTicker = function(){

    //     var obj = {

    //         userID: this.userID
    //     };

    //     var xhr = new XMLHttpRequest();

    //     xhr.onreadystatechange = function(){

    //         if (xhr.readyState==4 && xhr.status == 200){

    //             console.log(xhr.responseText);

    //         }
    //     };

    //     xhr.open('post', '/users/startTicker', true); 

    //     xhr.setRequestHeader('Content-Type', 'application/json');

    //     xhr.send(JSON.stringify(obj));        

    // };


    // AppView.prototype.resetTickerToZero = function(status){

    //     var obj = {

    //         userID: this.userID,

    //         playStatus: status
    //     };

    //     var xhr = new XMLHttpRequest();

    //     xhr.onreadystatechange = function(){

    //         if (xhr.readyState==4 && xhr.status == 200){

    //             console.log(xhr.responseText);

    //         }
    //     };

    //     xhr.open('post', '/users/resetTickerToZero', true); 

    //     xhr.setRequestHeader('Content-Type', 'application/json');

    //     xhr.send(JSON.stringify(obj));        

    // };


    AppView.prototype.stopEffects = function(){

        this.stopStream();

        var obj = {

            queueID: this.spiralView.playingQueueID
        };   

        this.getGroupMembersForLeavingMessage(obj); 

        this.spiralView.playingQueue = null;

        this.spiralView.streamingName = null;

        this.spiralView.streamingID = null;

        this.spiralView.playlistNameTab.setContent(" ");

        if (this.spiralShown){

            if (this.spiralView.surfaces.length > 0){

                if (this.currentQueueID == this.spiralView.playingQueueID){

                    this.spiralView.sortNewSpiral();

                    this.spiralView.removeHighlight();
                }
            }
        }

        this.spiralView.playingQueueID = null;

    };


    AppView.prototype.tellOtherMembersToSwitchToSpiralToo = function() {

        var that = this;

        var postObj = {

            id: this.currentQueueID,

            userID: this.userID
        };

        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function(){

            if (xhr.readyState==4 && xhr.status == 200){

                console.log(xhr.responseText);

            }
        };

        xhr.open('post', '/users/getMembersForSwitchToSpiral', true); 

        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.send(JSON.stringify(postObj));   

    };

    AppView.prototype.applyTastePoints = function(obj){

        var that = this;

        var postObj = {

            userID: obj.userID,

            changeBy: obj.direction
        };

        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function(){

            if (xhr.readyState==4 && xhr.status == 200){

                var returnObj = JSON.parse(xhr.responseText);

                if (returnObj.userStatus){

                    that.tellUserToUpdateTastePoints(obj);
                }

            }
        };

        xhr.open('post', '/users/applyTastePoints', true); 

        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.send(JSON.stringify(postObj));        

    };

    AppView.prototype.tellUserToUpdateTastePoints = function(obj){

        this.pubnub.publish({

            channel: obj.userID + 'UpdateTastePoints',

            message: obj

        });

    };


    AppView.prototype.restoreQueue = function (queueID) {

        var that = this;

        var obj = {

            id: queueID

        };

        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function(){

            if (xhr.readyState==4 && xhr.status == 200){

                console.log(xhr.responseText);
            }
        };  

        xhr.open('post', '/users/restoreQueue', true); 

        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.send(JSON.stringify(obj)); 

    }


    AppView.prototype.finishAddingSong = function(){

        this.trackToAdd.abbrevTrack = this.trackToAdd.name;

        if (this.trackToAdd.abbrevTrack.length > 16){

            this.trackToAdd.abbrevTrack = this.trackToAdd.abbrevTrack.slice(0, 13) + '...';
        }

        var artists = '';

        if (Array.isArray(this.trackToAdd.artists)){

            for (var i=0; i < this.trackToAdd.artists.length; i++){

                if (i == this.trackToAdd.artists.length-1){

                    artists = artists + this.trackToAdd.artists[i].name;

                }
                else {

                    artists = artists + this.trackToAdd.artists[i].name + ', ';
                }

            }
        }
        else {

            artists = this.trackToAdd.artists;

            this.trackToAdd.humanDuration = this.trackToAdd.duration;

        }

        this.trackToAdd.abbrevArtist = artists;

        if (this.trackToAdd.abbrevArtist.length > 16){

            this.trackToAdd.abbrevArtist = this.trackToAdd.abbrevArtist.slice(0, 13) + '...';
        }

        var initials = this.myName.slice(0, 1) + this.myName.slice(this.myName.indexOf(' ')+1, this.myName.indexOf(' ')+2);

        this.postNewTrackToAllQueues(artists, initials);

        this.checkIfInsideSpiral(artists, initials);

    };

    AppView.prototype.checkIfInsideSpiral = function(artists, initials){

        var trackObj = {

            link: this.trackToAdd.link,

            track: this.trackToAdd.name,

            abbrevTrack: this.trackToAdd.abbrevTrack,

            artist: artists,

            abbrevArtist: this.trackToAdd.abbrevArtist,

            duration: this.trackToAdd.humanDuration,

            uploadTime: this.uploadTime,

            coverArt: this.trackToAdd.coverArt,

            posterName: this.myName,

            posterID: this.userID,

            posterInitials: initials,

            voteCount: 0

        };

        if (this.spiralShown && this.currentQueueID == this.queueToAddTo){

            this.pushNewSongToCurrentSpiral(trackObj);

        }
        else {

            if (this.spiralView.playingQueueID == this.queueToAddTo){

                this.spiralView.playingQueue.push(trackObj);
            }

        }

    };


    AppView.prototype.pushNewSongToCurrentSpiral = function(newTrack){

        var lengthOfSpiralPrePush = this.spiralView.surfaces.length;

        this.newSongView = new SongView([0.1796*this.options.size[0], 0.108*this.options.size[1]]);

        this.fadeTrackArtIn();

        this.newSongView.songArt.setContent(newTrack.coverArt);

        this.newSongView.uploadTime = this.uploadTime;

        this.newSongView.voteCount = 0;

        this.newSongView.votePosition = 0;

        this.spiralView.surfaces.push(this.newSongView);

        this.spiralView.songInfoArray.push(newTrack);

        this.spiralView.sortNewSpiral();

        this.spiralView.spiralChangeLock = false;

        this.spiralView.pushLock = false;

    };

    AppView.prototype.fadeTrackArtIn = function() {

        this.newSongView.songArtModifier.setOpacity(0);

        this.newSongView.rootModifier.setOpacity(0);

        this.newSongView.songArtModifier.setOpacity(1, {duration: 1000});

        if (this.spiralView.zoomed){

	        this.newSongView.rootModifier.setOpacity(1, {duration: 1000});
    	
        }

    };


    AppView.prototype.resetPushCount = function(){

        this.pushCount = 0;

    };


    AppView.prototype.postNewTrackToAllQueues = function(artists, initials){

        this.uploadTime = new Date().getTime();

        var postObj = {

            songObj: {

                uploadTime: this.uploadTime,

                link: this.trackToAdd.link,

                track: this.trackToAdd.name,

                abbrevTrack: this.trackToAdd.abbrevTrack,

                artist: artists,

                abbrevArtist: this.trackToAdd.abbrevArtist,

                duration: this.trackToAdd.humanDuration,

                posterID: this.userID,

                posterName: this.myName,

                posterInitials: initials,

                voteCount: 0
            },

            id: this.queueToAddTo

        };

        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function(){

            if (xhr.readyState==4 && xhr.status == 200){

                console.log(xhr.responseText);

            }
        };

        xhr.open('post', '/users/addSongToQueue', true); 

        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.send(JSON.stringify(postObj));    

    }; 

    AppView.prototype.rezeroSpiralView = function(){

        if (this.spiralView.surfaces.length==0){

            return;
        }
        else {

            this.spiralView.surfaces.pop();

            this.rezeroSpiralView();
        }
    };


    AppView.prototype.getTracksFromDB = function(){

        this.spiralView.spiralChangeLock = true;

        this.rezeroSpiralView();

        this.trackList = [];

        this.voteCountArray = [];

        this.uploadTimeArray = [];

        this.justLinkArray = [];

        this.coverArtArray = [];

        this.songTitlesArray = [];

        this.spiralView.songInfoArray = [];

        this.streamArray = [];

        this.songObjArray = [];

        this.songsArrayIndex = 0;

        var that = this;

        var sendObj = {

            id: this.currentQueueID
        };

        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function(){

            if (xhr.readyState==4 && xhr.status == 200){

                var response = JSON.parse(xhr.responseText);

                var unsortedSongsArray = response.songs;

                that.spiralView.streamingID = response.streamingID;

                that.spiralView.streamingName = response.streamingName;

                that.playingSong = response.playingSong;

                that.currentQueuePrivacy = response.privacy;

                that.currentQueueHostID = response.host;

                if (unsortedSongsArray.length==0){

                    that.showNoContents();

                }
                else {

                    if (that.spiralView.streamingID == that.userID || that.spiralView.streamingID == null){

                        that.spiralView.streamLock = false;
                    }
                    else {

                        that.spiralView.streamLock = true;
                    }

                    that.sortTheSongs(unsortedSongsArray);
                }

            }
        };

        xhr.open('post', '/users/getTracksFromDB', false); 

        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.send(JSON.stringify(sendObj));                

    };


    AppView.prototype.sortTheSongs = function(unsortedSongsArray){

        this.indexOfPlayingSong = null; 

        if (this.spiralView.streamingID != null){

            for (var i=0; i<unsortedSongsArray.length; i++){

                if (unsortedSongsArray[i].link == this.playingSong){

                    this.indexOfPlayingSong = i;

                    var songZero = unsortedSongsArray.splice(i, 1);

                    this.trackList = unsortedSongsArray.sort(function(a,b) {

                        if (a.voteCount==b.voteCount){

                            return (a.uploadTime > b.uploadTime) ? 1 : ((b.uploadTime > a.uploadTime) ? -1 : 0);

                        }
                        else {

                            return (a.voteCount < b.voteCount) ? 1 : ((b.voteCount < a.voteCount) ? -1 : 0);

                        }
                    });

                    this.trackList.unshift(songZero[0]);

                    this.pushTrackInfoToOtherArrays();

                }

            }

        }
        else {

            this.trackList = unsortedSongsArray.sort(function(a,b) {

                if (a.voteCount==b.voteCount){

                    return (a.uploadTime > b.uploadTime) ? 1 : ((b.uploadTime > a.uploadTime) ? -1 : 0);

                }
                else {

                    return (a.voteCount <  b.voteCount) ? 1 : ((b.voteCount < a.voteCount) ? -1 : 0);

                }
            });

            this.pushTrackInfoToOtherArrays();
        }

    };


    AppView.prototype.pushTrackInfoToOtherArrays = function(){

        this.spiralView.songInfoArray = this.trackList;

        for (var i=0; i<this.trackList.length; i++){

            this.songTitlesArray.push(this.trackList[i].abbrevTrack);

            this.voteCountArray.push(Number(this.trackList[i].voteCount));

            this.justLinkArray.push(this.trackList[i].link);

            this.uploadTimeArray.push(this.trackList[i].uploadTime);

            this.coverArtArray.push(this.trackList[i].coverArt);

            if (i==this.trackList.length-1){

                this.setSpiralContent();

            }
        }

    };

    AppView.prototype.setSpiralContent = function(){

        for (var n=0; n<this.spiralView.songInfoArray.length; n++){

            this.songView = new SongView([0.1796*this.options.size[0], 0.108*this.options.size[1]]);

            this.songTitleInstance = this.songTitlesArray[n];

            this.songView.voteCount = this.voteCountArray[n];

            this.songView.uploadTime = this.uploadTimeArray[n];

            this.songView.songArt.setContent(this.coverArtArray[n]);

            this.spiralView.surfaces.push(this.songView);

            if (n==this.spiralView.songInfoArray.length-1){

                this.waitForPush();
            }

        }

    };

    AppView.prototype.waitForPush = function(){

        if (this.spiralView.surfaces[this.trackList.length-1]){

            this.spiralView.createListeners();

            this.getPreviousVotes();

            this.showSpiralView();
        }
        else {

            setTimeout(this.waitForPush.bind(this), 200);
        }

    };


    AppView.prototype.getPreviousVotes = function(){

        var that = this;

        var sendObj = {

            userID: this.userID,

            queueID: this.currentQueueID
        };

        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function(){

            if (xhr.readyState==4 && xhr.status == 200){

                var obj = JSON.parse(xhr.responseText);

                that.applyPreviousVotes(obj);

            }
        };

        xhr.open('post', '/users/getPreviousVotes', true); 

        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.send(JSON.stringify(sendObj));        

    };
    


    AppView.prototype.applyPreviousVotes = function(obj){

        var upVoteArray = obj.upVotes;

        var downVoteArray = obj.downVotes;

        for (var i=0; i<upVoteArray.length; i++){

            for (var j=0; j<this.spiralView.songInfoArray.length; j++){

                if (upVoteArray[i] == this.spiralView.songInfoArray[j].link){
                    
                    this.spiralView.surfaces[j].votePosition = 1;
                }
            }
        }

        for (var k=0; k<downVoteArray.length; k++){

            for (var l=0; l<this.spiralView.songInfoArray.length; l++){

                if (downVoteArray[k] == this.spiralView.songInfoArray[l].link){
                    
                    this.spiralView.surfaces[l].votePosition = -1;
                }
            }
        }

        for (var m = 0; m < this.spiralView.surfaces.length; m++){

            if (this.spiralView.surfaces[m].votePosition != 1 && this.spiralView.surfaces[m].votePosition != -1){

                this.spiralView.surfaces[m].votePosition = 0;
            }
        }

    };


    AppView.prototype.showSpiralView = function(){

        this.spiralView.spiralChangeLock = false;

        if (window.webkit){

            window.webkit.messageHandlers.removeLoadingSpiral.postMessage('remove that shit');
        }
        else {

            window.location = "toolbar://removeLoadingSpiral/";
        }

        var that = this;

        var streamingName = '';

        if (this.spiralView.streamingID == this.userID){

            this.spiralView.addHighlight();  

            var streamerName = this.spiralView.streamingName;

            if (streamerName.length > 20){

                var lastInitial = streamerName.slice(streamerName.indexOf(' ')+1, streamerName.indexOf(' ')+2);

                streamerName = streamerName.slice(0, streamerName.indexOf(' ')+1)+lastInitial+'.';
            }

            this.spiralView.playlistNameTab.setContent("( "+streamerName+" )");
        }

        else if (this.spiralView.streamingID != this.userID && this.spiralView.streamingID != null){

            this.spiralView.addHighlight();  

            var streamerName = this.spiralView.streamingName;

            if (streamerName.length > 20){

                var lastInitial = streamerName.slice(streamerName.indexOf(' ')+1, streamerName.indexOf(' ')+2);

                streamerName = streamerName.slice(0, streamerName.indexOf(' ')+1)+lastInitial+'.';
            }

            this.spiralView.playlistNameTab.setContent("( "+streamerName+" )");

        }

        else {

            this.spiralView.removeHighlight();

            this.spiralView.playlistNameTab.setContent('');

        }

        this.spiralView.setFirstSongsInfo();

        if (this.currentIndex != 0){

            this.lightbox.setOptions({inTransform: Transform.translate(0, this.options.size[1], 0), outTransform: Transform.translate(0, 0, 0), overlap: true, outOpacity: 0});

            this.currentIndex = 0;

            this.lightbox.show(this.slides[0]);

            this.spiralShown = true;

            this.noContentsShown = false;

            this.spinSpiralToTop();
        }

    };

    AppView.prototype.showNoContents = function(){

        if (window.webkit){

            window.webkit.messageHandlers.removeLoadingSpiral.postMessage('remove that shit');
        }
        else {

            window.location = "toolbar://removeLoadingSpiral/";
        }

        var that = this;

        this.currentIndex = 1;

        this.lightbox.setOptions({inTransform: Transform.translate(0, 0, 0), outTransform: Transform.translate(0, 0, 0), overlap: false, outOpacity: 0});

        this.lightbox.show(this.slides[1], spring2);

        this.noContentsShown = true;

    };


    AppView.prototype.checkRecipientStatus = function(infoArray){

        var that = this;

        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function(){

            if (xhr.readyState==4 && xhr.status == 200){

                var activeUsersArray = JSON.parse(xhr.responseText);

                for (var i=0; i<activeUsersArray.length; i++){

                    if (activeUsersArray[i].messageType=='invite'){

                        that.sendInvites(activeUsersArray[i]);  

                    }

                    else if (activeUsersArray[0].messageType=='request'){

                        that.sendRequest(activeUsersArray[0]);


                    }

                    else if (activeUsersArray[0].messageType=='requestResponse'){

                        that.sendRequestResponse(activeUsersArray[0]);

                    }


                }

                if (infoArray[0].messageType == 'invite'){

                    that.reGrabMembers();
                }
            }
        };

        xhr.open('post', '/users/checkRecipientStatus', true); 

        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.send(JSON.stringify(infoArray));

    };


    AppView.prototype.sendInvites = function(obj){

        var invite = {

            senderName: obj.senderName,

            queueName: obj.queueName,

            messageContent: obj.messageContent,

            messageType: obj.messageType,

            senderID: this.userID,

            queueID: obj.queueID,

            privacy: obj.privacy,

            wholeThing: obj
        };

        this.pubnub.publish({

            channel: obj.friendID + 'Invitation',

            message: invite

        });

    };


    AppView.prototype.sendInviteResponse = function(inviteObj){

        var inviteResponse = {

            senderName: this.myName,

            queueName: inviteObj.queueName,

            queueID: inviteObj.queueID,

            messageContent: ' has accepted your invite to join ',

            messageType: 'inviteResponse',

            wholeThing: inviteObj

        };

        console.log('published inviteResponse');

        this.pubnub.publish({

            channel: inviteObj.friendID + 'InvitationResponse',

            message: inviteResponse

        });         

    };


    AppView.prototype.sendRequest = function(requestObj){

        var request = {

            senderName: this.myName,

            queueName: requestObj.queueName,

            friendID: this.userID,

            messageType: requestObj.messageType,

            messageContent: requestObj.messageContent,

            queueID: requestObj.queueID,

            wholeThing: requestObj

        };

        this.pubnub.publish({

            channel: requestObj.friendID + 'Request',

            message: request

        });    
    };


    AppView.prototype.sendRequestResponse = function(responseObj){

        var requestResponse = {

            senderName: this.myName,

            queueName: responseObj.queueName,

            queueID: responseObj.queueID,

            messageContent: responseObj.messageContent,

            messageType: responseObj.messageType,

            acceptorID: this.userID,

            wholeThing: responseObj

        };

        console.log('published requestResponse');

        this.pubnub.publish({

            channel: responseObj.friendID + 'RequestResponse',

            message: requestResponse

        });         

    };

    AppView.prototype.sendRequestDoubleResponse = function(requestDoubleResponse){

        var requestDoubleMessage = {

            queueID: requestDoubleResponse.queueID
        };

        this.pubnub.publish({

            channel: requestDoubleResponse.callbackUserID + 'DoubleResponse',

            message: requestDoubleMessage

        });         

    };



    AppView.prototype.removeYourselfFromPreviousStream = function(songToPlay, tellFriendsToRemoveYou) {

        if (this.spiralView.playingQueueID == null){

            this.setYourselfAsStreamer(songToPlay);
        }
        else{

            var that = this;

            var arr = [];

            arr.push(this.spiralView.playingQueueID);

            var sendObj = {

                userID: this.userID,

                queueIDArray: arr
            };

            var otherObj = {

                queueID: this.spiralView.playingQueueID
            };

            if (tellFriendsToRemoveYou){

                this.getGroupMembersForLeavingMessage(otherObj);
            }

            var xhr = new XMLHttpRequest();

            xhr.onreadystatechange = function(){

                if (xhr.readyState==4 && xhr.status == 200){

                    that.setYourselfAsStreamer(songToPlay);

                }
            };

            xhr.open('post', '/users/removeYourselfAsStreamer', true); 

            xhr.setRequestHeader('Content-Type', 'application/json');

            xhr.send(JSON.stringify(sendObj));
        }

    };


    AppView.prototype.stopStream = function(){

        var sendObj = {

            queueID: this.spiralView.playingQueueID,

            userID: this.userID
        
        };

        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function(){

            if (xhr.readyState==4 && xhr.status == 200){

                console.log(xhr.responseText);
            }
        };  

        xhr.open('post', '/users/stopStream', true); 

        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.send(JSON.stringify(sendObj)); 

    };


    AppView.DEFAULT_OPTIONS = {
        placeholder: null
    };

//----------------Helper functions----------------------------------


    function _initPubnub(){

        this.pubnub = PUBNUB.init({
            publish_key: 'pub-c-46a6e70b-932c-464e-899b-1b211eebb103',
            subscribe_key: 'sub-c-6f80e180-2bba-11e4-bbfa-02ee2ddab7fe',
            origin: 'pubsub.pubnub.com',
            ssl: true
        });

    }


    function _createBackgroundView (){

        this.backgroundView = new Surface({
            size: [2.1944*this.options.size[0], 2.2016*this.options.size[1]],
            properties: {
                backgroundColor: 'rgba(0,0,0,0)'
            }
        });

        this.backgroundViewModifier = new StateModifier({
            origin: [0.5, 0.5],
            align: [0.5, 0.5],
            transform: Transform.translate(0, 0, -600)
        });

        this.mainNode.add(this.backgroundViewModifier).add(this.backgroundView);
    }

    function _createLightbox (){

        this.lightbox = new Lightbox();

        this.lightbox.setOptions({inTransform: Transform.translate(0, this.options.size[1], 0), outTransform: Transform.translate(0, 0, 0), inTransition: spiralSpring, outTransition: {duration: 0}, outOpacity: 0, overlap: false});

        this.mainNode.add(this.lightbox);

        this.slides = [];
    }


    function _addSpiralView (){

        this.spiralView = new SpiralView(this.options.size);

        this.slides.push(this.spiralView);

        // 6-plus
        if (this.options.size[0] > 400){

            this.spiralView.rootModifier.setTransform(Transform.moveThen([0.016*this.options.size[0], -0.05*this.options.size[1], -40], Transform.rotateY(-0.11)));

        }

        // 6
        else if (this.options.size[0] < 400 && this.options.size[0] > 350){

            this.spiralView.rootModifier.setTransform(Transform.moveThen([0*this.options.size[0], -0.05*this.options.size[1], -60], Transform.rotateY(-0.11)));

        }

        // 5
        else {

            this.spiralView.rootModifier.setTransform(Transform.moveThen([-0.016*this.options.size[0], -0.05*this.options.size[1], -92], Transform.rotateY(-0.11)));
        }
    }


    function _addNoSongsView(){

        this.noSongsView = new NoSongsView(this.options.size);

        this.slides.push(this.noSongsView);

    }

    function _addObjCHandlers(){

        var that = this;

        window.passQueueAndUserID = function(obj){

            if (window.webkit){

                window.webkit.messageHandlers.gotUserID.postMessage('stop that shit');
            }

            that.userID = obj.userID;

            that.spiralView.userID = that.userID;

            that.myName = obj.myName;

            that.currentQueueID = obj.queueID;

            that.spiralView.currentQueueID = obj.queueID;

            that.getTracksFromDB();

        };


        window.passQueueID = function(obj){

            if (obj.queueID == that.currentQueueID){

                if (obj.queueID == that.queueJustRestored || that.noContentsShown){

                    that.getTracksFromDB();     
                }

            }
            else {

                that.currentQueueID = obj.queueID;

                that.spiralView.currentQueueID = obj.queueID;

                that.getTracksFromDB();
            }

            that.queueJustRestored = null;

        };

        window.passNewSong = function(obj){

            var abbreviatedTrack = obj.track;

            if (abbreviatedTrack.length > 16){

                abbreviatedTrack = abbreviatedTrack.slice(0, 13) + '...';
            }

            var abbreviatedArtist = obj.artist;

            if (abbreviatedArtist.length > 16){

                abbreviatedArtist = abbreviatedArtist.slice(0, 13) + '...';
            }

            var initials = obj.posterName.slice(0, 1) + obj.posterName.slice(obj.posterName.indexOf(' ')+1, obj.posterName.indexOf(' ')+2);

            var trackObj = {

                link: obj.link,

                track: obj.track,

                abbrevTrack: abbreviatedTrack,

                artist: obj.artist,

                abbrevArtist: abbreviatedArtist,

                duration: obj.duration,

                uploadTime: obj.uploadTime,

                coverArt: obj.coverArt,

                posterName: obj.posterName,

                posterID: obj.posterID,

                posterInitials: initials,

                voteCount: 0

            };

            that.pushNewSongToCurrentSpiral(trackObj);

        };

        window.stopMusic = function(){

            that.stopEffects();

            if (that.spiralView.zoomed){

                that.spiralView.songInfoView.rootModifier.setTransform(Transform.thenMove(Transform.rotateY(0.11), [0, -0.01*that.options.size[1], 0]), {duration: 350, curve: Easing.outQuad});
                that.spiralView.modifier.setTransform(Transform.translate(0.09*that.options.size[0], 0.04*that.options.size[1], 330), {duration: 350, curve: Easing.outQuad});
            }
        };

        window.restoreQueue = function(obj) {

            that.queueJustRestored = obj.id;

            that.restoreQueue(obj.id);

        };

        window.refreshSpiral = function(obj){

            if (that.spiralShown && that.currentQueueID == obj.queueID){

                if (!that.spiralChangeLock){

                    that.checkIfYouCanRefreshSpiral(obj);
                }

            }
            else if (that.currentIndex == 1 && that.currentQueueID == obj.queueID){

                that.getTracksFromDB();
            }
            else {

                if (that.spiralView.playingQueueID == obj.queueID){

                    that.checkIfYouCanUpdateArrays(obj);

                }                
            }            
        };    


        window.justUpdateArrays = function (obj) {

            if (that.spiralView.playingQueueID == obj.queueID){

                that.checkIfYouCanUpdateArrays(obj);

            }
        };

        window.allSongsAreGone = function (obj) {

            var queueID = obj.queueID;

            if (that.spiralShown && that.currentQueueID == queueID){

                that.spiralView.surfaces.shift();

                that.lightbox.setOptions({inTransform: Transform.translate(0, 0, 0), outTransform: Transform.translate(0, 0, 0), overlap: false, outOpacity: 0, inOpacity: 0});

                that.lightbox.show(that.slides[1], {duration: 500});

                that.spiralShown = false;
            }
        };

        window.activeAgain = function () {

            if (that.spiralShown){

                that.rePushSpiral(null, true);

            }
        };

        window.leavingAppAsStreamer = function (obj) {

            if (that.spiralShown && that.currentQueueID==obj.queueID){

                that.spiralView.streamLock = false;

                that.spiralView.streamingID = null;

                that.spiralView.sortNewSpiral();

                that.spiralView.streamingName = null;

                that.spiralView.removeHighlight();

                that.spiralView.playlistNameTab.setContent(" ");

            }

        };

        window.leavingAppAsStreamerFromTimeout = function (obj) {

            if (that.spiralShown && that.currentQueueID==obj.queueID && that.userID != obj.userID){

                that.spiralView.streamLock = false;

                that.spiralView.streamingID = null;

                that.spiralView.sortNewSpiral();

                that.spiralView.streamingName = null;

                that.spiralView.removeHighlight();

                that.spiralView.playlistNameTab.setContent(" ");
            }

            else if (that.userID == obj.userID){

                if (that.spiralShown){

                    if (that.currentQueueID == that.spiralView.playingQueueID){

                        that.spiralView.playlistNameTab.setContent(" ");
                    }

                }

                else {

                }

                that.stopEffectsForFormerStreamer();

            }
            else {


            }

        };

        window.userHasFree = function(){

            that.spiralView.userHasPremium = false;

            that.loggedInWithSpotify = true;

        };

        window.userHasPremium = function(){

            that.spiralView.userHasPremium = true;

            that.loggedInWithSpotify = true;
        };


    }


    function _createListeners (){

        this.backgroundView.on('click', function(){

            if (this.currentIndex==0 && this.spiralView.zoomed){

                this.zoomSpiralOut();
            }

        }.bind(this));

        // this.spiralView.on('sendStreamingPushNote', function (){
            
        //     var obj = {

        //         queueID: this.currentQueueID,

        //         queueName: this.currentQueueName,

        //         streamingName: this.myName

        //     };

        //     var xhr = new XMLHttpRequest();

        //     xhr.onreadystatechange = function(){

        //         if (xhr.readyState==4 && xhr.status == 200){

        //             console.log(xhr.responseText);
        //         }
        //     };  

        //     xhr.open('post', '/users/getGroupMembersForStreamingMessage', true); 

        //     xhr.setRequestHeader('Content-Type', 'application/json');

        //     xhr.send(JSON.stringify(obj));             

        // }.bind(this));

        this.spiralView.on('stopStream', function () {

            if (this.spiralShown){

                if (this.currentQueueID == this.spiralView.playingQueueID){

                    this.spiralView.playlistNameTab.setContent(" ");

                    this.lightbox.setOptions({inTransform: Transform.translate(0, 0, 0), outTransform: Transform.translate(0, 0, 0), overlap: false, outOpacity: 0, inOpacity: 0});

                    this.currentIndex = 1;

                    this.lightbox.show(this.slides[1], {duration: 500});

                    this.spiralShown = false;
                }

            }
            else {

            }

            this.hideNowPlayingView();

            this.stopEffects();

            if (window.webkit){

                window.webkit.messageHandlers.stopMusic.postMessage('stopMusic');
            }
            else {

                window.location = "toolbar://stopMusic/";
            }

        }.bind(this));

        this.spiralView.on('tellFriendsAllSongsAreGone', function(){

            this.findQueueArtIndex('img/logoPlaceholder.png', this.currentQueueID, false, null);

            var that = this;

            var obj = {

                id: this.currentQueueID,

                userID: this.userID
            };

            var xhr = new XMLHttpRequest();

            xhr.onreadystatechange = function(){

                if (xhr.readyState==4 && xhr.status == 200){

                    console.log(xhr.responseText);
                }
            };  

            xhr.open('post', '/users/findMembersForAllSongsAreGoneMessage', true); 

            xhr.setRequestHeader('Content-Type', 'application/json');

            xhr.send(JSON.stringify(obj)); 

        }.bind(this));

        this.spiralView.on('zoomOut', function (){

            this.zoomSpiralOut();

        }.bind(this));

        this.spiralView.on('applyTastePoints', function(obj){

            this.applyTastePoints(obj);

        }.bind(this));

        this.spiralView.on('updateLastTrack', function(obj){

            this.updateLastTrack(obj);

        }.bind(this));

 
        this.spiralView.on('emitZoomIn', function(){

            this.zoomSpiralIn();

        }.bind(this));

        this.spiralView.on('tellFriendsToRoll', function(obj){

            this.tellFriendsToRoll(obj);

            var that = this;

        }.bind(this));

        this.spiralView.on('stopStream', function(){

            if (this.currentQueueID == this.spiralView.playingQueueID){

                this.spiralView.playlistNameTab.setContent(" ");
            }

            this.stopEffects();

            if (window.webkit){

                window.webkit.messageHandlers.stopMusic.postMessage('stopMusic');
            }
            else {

                window.location = "toolbar://stopMusic/";
            }

        }.bind(this));

        this.spiralView.on('playSelectedSong', function(obj){

            var sendObj = {

                userID: this.userID,

                queueID: this.currentQueueID,

                songToPlay: obj.play,

                songToRemove: obj.remove,

                myName: this.myName

            };

            this.spiralView.streamingID = this.userID;

            this.spiralView.streamingName = this.myName;

            this.spiralView.playingQueue = this.spiralView.songInfoArray;

            this.spiralView.playingQueueID = this.currentQueueID;

            this.spiralView.playingQueue = this.spiralView.songInfoArray;

            var streamerName = this.spiralView.streamingName;

            if (streamerName.length > 20){

                var lastInitial = streamerName.slice(streamerName.indexOf(' ')+1, streamerName.indexOf(' ')+2);

                streamerName = streamerName.slice(0, streamerName.indexOf(' ')+1)+lastInitial+'.';
            }

            this.spiralView.playlistNameTab.setContent("( "+streamerName+" )");

            var xhr = new XMLHttpRequest();

            xhr.onreadystatechange = function(){

                if (xhr.readyState==4 && xhr.status == 200){

                    console.log(xhr.responseText);
                }
            };  

            xhr.open('post', '/users/playSelectedSong', true); 

            xhr.setRequestHeader('Content-Type', 'application/json');

            xhr.send(JSON.stringify(sendObj));                 

        }.bind(this));


        this.spiralView.on('setYourselfAsStreamer', function(songLink){

            this.spiralView.streamingID = this.userID;

            this.spiralView.streamingName = this.myName;

            this.queuesStreamed.push(this.currentQueueID);

            // if this is your first queue 
            if (this.queuesStreamed[this.queuesStreamed.length-1] == this.queuesStreamed[this.queuesStreamed.length-2] || this.queuesStreamed.length==1){

                this.removeYourselfFromPreviousStream(songLink, false);   

            }
            else {

                this.removeYourselfFromPreviousStream(songLink, true);   
            }
    
            var streamerName = this.spiralView.streamingName;

            if (streamerName.length > 20){

                var lastInitial = streamerName.slice(streamerName.indexOf(' ')+1, streamerName.indexOf(' ')+2);

                streamerName = streamerName.slice(0, streamerName.indexOf(' ')+1)+lastInitial+'.';
            }

            this.spiralView.playlistNameTab.setContent("( "+streamerName+" )");

        }.bind(this));        

        this.spiralView.on('tellFriendsToShiftPlayingOrder', function(obj){

            this.tellFriendsToShiftPlayingOrder(obj);

        }.bind(this));        

        this.spiralView.on('updateSongProperties', function(obj){

            this.updateSongProperties(obj);

        }.bind(this));

        this.spiralView.on('reloadQueue', this.getTracksFromDB.bind(this));

        this.spiralView.on('switchSongPositions', function(obj){

            var currIndex = obj.currPos;

            var newIndex = obj.newPos;

        }.bind(this));

        this.spiralView.on('updateDBVoteCount', function(obj){

            this.updateDBVoteCount(obj);

        }.bind(this));

        this.spiralView.on('tellFriendsToUpdateVoteCount', function(obj){

            this.tellFriendsToUpdateVoteCount(obj);

        }.bind(this));

        this.spiralView.on('playNextSong', function(){

            this.spiralView.checkIfYouCanRoll('no');

        }.bind(this)); 

        this.spiralView.on('checkIfUserHasAttemptedToLogin', function(){

            // show get premium btn
            if (this.loggedInWithSpotify && !this.spiralView.userHasPremium){

                if (window.webkit){

                    window.webkit.messageHandlers.showSpotifyBtn.postMessage('no');
                }
                else {

                    window.location = "toolbar://showSpotifyBtn/no";
                }
                // premium link
            }


            // show login btn
            else {

                if (window.webkit){

                    window.webkit.messageHandlers.showSpotifyBtn.postMessage('yes');
                }
                else {

                    window.location = "toolbar://showSpotifyBtn/yes";
                }

            }

        }.bind(this));
        // this.spiralView.on('firstQueue', function(){

        //     this.firstQueueCount++;

        //     if (this.firstQueueCount==1){

        //         this.spiralView.playing = true;

        //         this.spiralView.streamingID = this.userID;

        //         this.spiralView.streamingName = this.myName;

        //         // this.startDBTicker();

        //         setTimeout(function(){

        //             this.spiralView.firstQueueActivated = true;

        //         }.bind(this), 2000);
        //     }

        // }.bind(this));

        this.spiralView.on('setYourPlayingQueue', function(i){

        //     if (this.activeQueueIndex != null){

        //         var oldActiveQueueIndex = this.activeQueueIndex;

        //         this.j = Math.floor((oldActiveQueueIndex)/3);

        //         this.k = (oldActiveQueueIndex) % 3;  
        //     }

        //     this.activeQueueIndex = i;

        //     this.spiralView.activeQueueIndex = i;

            this.spiralView.playingQueue = this.spiralView.songInfoArray;

            this.spiralView.playingQueueID = this.currentQueueID;

        //     this.j = Math.floor((this.activeQueueIndex)/3);

        //     this.k = (this.activeQueueIndex) % 3;  

        //     this.queueTileHasHighlight = true; 

        }.bind(this));

        // this.spiralView.on('playSelected', function(){

        //     if (!this.spiralView.playing){

        //         // this.resetTickerToZero('playing');

        //         this.spiralView.playing = true;
        //     }

        // }.bind(this));

        this.spiralView.playlistNameTab.on('click', function(){

            if (this.currentIndex==3 && this.spiralView.zoomed){

                this.zoomSpiralOut();
            }

        }.bind(this));
    };



    module.exports = AppView;
    
});



