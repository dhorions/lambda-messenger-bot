'use strict';
console.log('Loading function');
const request = require('request');
const https = require('https');
var PAGE_ACCESS_TOKEN;
var MESSENGER_VALIDATION_TOKEN;

var responses = Array(
    {
        text : "Hi, I'm lambda-messenger-bot.  I give random responses",
        imageUrl: null
    },
    {
        text : "I was created by Dries Horions ( http://github.com/dhorions ).",
        imageUrl: "http://quodlibet.be/images/dries.png"
    },
    {
        text : "You can find my code on Medium ( http://mediumurl.",
        imageUrl: null
    },
    {
        text : "Do you like coffee?",
        imageUrl: "https://s3.eu-central-1.amazonaws.com/qlrandomcrap/lambda-messenger-bot/coffee.jpg"
    },
    {
        text : null,
        imageUrl:"https://s3.eu-central-1.amazonaws.com/qlrandomcrap/lambda-messenger-bot/ideas.jpg"
    },
    {
        text : "I just want to tell you how I'm feeling",
        imageUrl: null
    },
    {
        text : "Gotta make you understand",
        imageUrl: null
    },
    {
        text : "Never gonna give you up, never gonna let you down",
        imageUrl: "https://s3.eu-central-1.amazonaws.com/qlrandomcrap/lambda-messenger-bot/rr.png"
    }
    );

exports.handler = (event, context, callback) => {
    MESSENGER_VALIDATION_TOKEN = event["stage-variables"]["MESSENGER_VALIDATION_TOKEN"] || "swordfish";
    PAGE_ACCESS_TOKEN          = event["stage-variables"]["PAGE_ACCESS_TOKEN"] ;
    console.log('Received event:', JSON.stringify(event, null, 2));
    var method = event.context["http-method"];
    var response = "";
    var queryparams = event.params.querystring;
    if(method === "GET")
    {
        if(queryparams['hub.mode'] === 'subscribe' 
           && 
          queryparams['hub.verify_token'] === MESSENGER_VALIDATION_TOKEN){
          response = queryparams['hub.challenge'];
        }
        else{
          response ="Incorrect verify token"
        }
        callback(null, response);//return the challenge
    }
    else
    {
        if(method === "POST")
        {
            var messageEntries = event["body-json"].entry;
            for(var entryIndex in messageEntries)
            {
                var messageEntry = messageEntries[entryIndex].messaging;
                for(var messageIndex in messageEntry)
                {
                    var message = messageEntry[messageIndex];
                    if(message.message !== undefined  && message.message["is_echo"] !== true )
                    {
                        var botresponse = responses[Math.floor(Math.random()*responses.length)];
                        respond(message.sender.id,botresponse.text, botresponse.imageUrl);
                    }
                }
            }
        }
    }
};

var respond = function respond(recipientId,textMessage, imageUrl)
{
    var messageData = {};
    messageData.recipient = {id:recipientId};

    if(imageUrl !== null && textMessage !== null)
    { 
        //Use generic template to send a text and image
        
        messageData.message =  {
            attachment : {
                type : "template",
                payload : {
                        template_type : "generic",
                        elements : [{
                            title : textMessage,
                            image_url : imageUrl,
                            subtitle : textMessage
                        }]
                    }
                }
            };
    }
    else
    { 
        if (imageUrl !== null){
            //Send a picture
            
            messageData.message = {
                attachment : {
                    type : "image",
                    payload : {
                        url : imageUrl
                    }
                }
            };
        }
        else
        {
            //send a text message
             messageData.message = {
                 text : textMessage
             };
        }
    }
    request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      if (messageId) {
        console.log("Message %s delivered to recipient %s", 
          messageId, recipientId);
      } else {
      console.log("Message sent to recipient %s", 
        recipientId);
      }
    } else {
      console.error(response.error);
      console.log("Facebook Request failed    : " + JSON.stringify(response));
      console.log("Message Data that was sent : " + JSON.stringify(messageData));
    }
  });  
}