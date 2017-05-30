var Bandwidth = require("node-bandwidth");
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var http = require("http").Server(app);

var myBWNumber= process.env.BANDWIDTH_PHONE_NUMBER;

var client = new Bandwidth({
    // uses my environment variables 
    userId    : "u-axqs3dv6in72g4gfyxxcfhy", // <-- note, this is not the same as the username you used to login to the portal
    apiToken  : "t-wq4l4ckbp3eksnqx2dlz2ti",
    apiSecret : "uondfoamf4qdaf2heemwwtocncu2rp3u47b7t5a"
});

app.use(bodyParser.json());
//use a json body parser
app.set('port', (process.env.PORT || 3000));

app.post("/message-callback", function(req, res){
    var body= req.body; 
    //let the other know you got the request and we will process it 
    res.sendStatus(200);
    if(body.direction === "in"){
        var numbers={
            to: body.from, 
            from: body.to

        }
        sendMessage(numbers);
        
    }

});

app.get("/", function (req, res) {
    console.log(req); 
    res.send("Yola");
    //res.send(can be a website);
});

var messagePrinter= function (message){
    console.log('Using the message printer');
    console.log(message.to);
}

// var sendMessage = function(params){
//     client.Message.send({
//         //retuns a promse 
//         from : params.from,
//         to   : params.to,
//         text : "ILY",
//         //media: "https://img.memesuper.com/ce20eb4f1da26e98771cd1c17a2a5641_who-me-who-me-memes_632-651.png"
//     })
//     .then(function(message){
//         messagePrinter(message);
//         return client.Message.get(message.id)
//         //access ID from json can also get to and from
//     })
//     .then(messagePrinter)
//     // .then(function(myMessage){

//     // })
//     .catch(function(err){
//         console.log(err)
//     });
// }

var numbers = {
    to: "+13035659555",
    from: "+17204407441"
};
// sendMessage(numbers);

//creates a call from a bandwidth number to the phone
// client.Call.create({
//     from: "+17204407441",
//     to: "+13035659555",
//     callbackUrl: "http://2ab58988.ngrok.io"
// })

// var createCall = function(params){
// 	client.Call.create({
// 		from : params.from,
//         to   : params.to,
//         callbackUrl: "http://2ab58988.ngrok.io"
// 	})
//     .then(function (id) {
//         console.log(id);
//     })
// }
// createCall(numbers);

app.post("/outbound-callbacks", function(req, res){
    var body = req.body; 
    console.log(body); 
    if(checkIfAnswer(body.eventType)){
        speakSentenceInCall(body.callId, "Hello from me!!!")
        .then(function(response){
            console.log(response);
        })
        .catch(function (error){
            console.log(error);
        });
    }
    else if(isSpeakingDone(body)){
        client.Call.hangup(body.callId)
        .then(function(){
            console.log("Hangup call");
        })
        .catch(function(err){
            console.log("error in hanging up the call");
            console.log(err);
        });
    }

});
//entry point 
app.post("/calls", function(req, res){
    var callbackUrl= getBaseUrl(req) + "/outbound-callbacks";
    var body = req.body;
    var phoneNumber = body.phoneNumber;
    createCallWithCallback(phoneNumber, myBWNumber, callbackUrl)
    .then(function(call){
        console.log(call);
        res.send(call).status(201);
    })
    .catch(function(err){
        console.log("ERR CREATING CALL")
    });

});

var checkIfAnswer = function(eventType){
    return (eventType === "answer");
}

var createCallWithCallback = function(toNumber, fromNumber, callbackUrl){
    return client.Call.create({
        from: fromNumber,
        to: toNumber,
        callbackUrl: callbackUrl


    })
};
var getBaseUrl = function (req) {
    return 'http://' + req.hostname;
};

http.listen(app.get('port'), function(){
    //once done loadin then do this (callback)
    console.log('listening on *:' + app.get('port'));
});

var speakSentenceInCall = function(callID, sentence){
    return client.Call.speakSentence(callID, sentence);

}
var isSpeakingDone = function(callBackEvent){
    return (callBackEvent.eventType === "speak" && callBackEvent.state === "PLAYBACK_STOP");
}


