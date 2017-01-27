var express = require('express');
var router = express.Router();
var pubnub = require('pubnub').init({
    publish_key: 'pub-c-46a6e70b-932c-464e-899b-1b211eebb103',
    subscribe_key: 'sub-c-6f80e180-2bba-11e4-bbfa-02ee2ddab7fe'
});

router.post('/passPubNub', function(req, res){

    pubnub.publish({

        channel: '10206007342850980' + req.body.channel,

        message: 'Do it, bitch.'

    });

    res.send('pass back');

});


module.exports = router;





