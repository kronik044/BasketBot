//api.js
var request = require('request');
var properties = require('../config/properties.js')

// if our user.js file is at app/models/user.js
var User = require('../model/user');
var Session = require('../model/session');

exports.tokenVerification = function(req, res) {
	if (req.query['hub.verify_token'] === properties.facebook_challenge) {
    res.send(req.query['hub.challenge']);
  } else {
  	res.send('Error, wrong validation token');
  }
}

exports.handleMessage = function(req, res) {
  messaging_events = req.body.entry[0].messaging;
  for (i = 0; i < messaging_events.length; i++) {
    event = req.body.entry[0].messaging[i];
    sender = event.sender.id;
    console.log("Message Received from client ");
    if (event.message && event.message.text) {
      //text do all processing
      text = event.message.text;
      normalizedText = text.toLowerCase().replace(' ', '');
      console.log("Message Received -----------|| " + normalizedText);
      User.findOne({fb_id: sender}, function(err, user) {
        if (err) {
          console.log(err)
        } else {
          if (user != null) {
            userName = user.name;          
            if (event.message.quick_reply) {
              //process a quick reply
              quickReplyPLoad = event.message.quick_reply.payload;
              console.log("received payload " + quickReplyPLoad);
              signForSession(sender,userName,quickReplyPLoad);
            } else if (normalizedText.startsWith("+") && normalizedText.length ==3) {
              //process session sign message
              signForSession(sender,userName,normalizedText);
            } else {
              //process usual messages cases switch
              // Handle a text message from this sender
              switch(normalizedText) {
                case "/subs":
                  getUserDetails(sender, subscribeUser)
                  break;
                case "/unsub":
                  unsubscribeUser(sender)
                  break;
                case "/substatus":
                  subscribeStatus(sender)
                  break;
                case "help":
                  sendTextMessage(sender, "Available commands: \n\n \
                    /subs - to reactivate your subscription \n\n \
                    /substatus - get current subscription status \n\n \
                    /unsub - deactivate subscription (no autoreminders) \n\n \
                    +Fx - signup for nearest Football (x is number of players 0-9) \n\n \
                    +Bx - signup for nearest Basketball (x is number of players 0-9)")
                  break;
                case "test":
                  sendTextMessage2(sender, "testing quick reply")
                  break;
                case "ok":
                  whoWillPlay(sender)
                  break;
                default:
                  sendTextMessage(sender, "Hi! " + userName + " seems you need to run 'help' command to see possibele actions.")
              }
            }
          } else {
              //not a valid user
             console.log("Message in bottom Received ----------- " + normalizedText);
              switch(normalizedText) {
                case "pass":
                  getUserDetails(sender, subscribeUser)
                  break;
                default:
                  sendTextMessage(sender, "Hello!! I'm BasketBot. I'll help you to signup for Basket or Football sessions. If you know a correct passphrase :)")
                  break;
              }
            }
          }
    })
    }
  }
  res.sendStatus(200);
}

/*
exports.handleMessage = function(req, res) {
	messaging_events = req.body.entry[0].messaging;
	for (i = 0; i < messaging_events.length; i++) {
		event = req.body.entry[0].messaging[i];
		sender = event.sender.id;
    if (event.message.quick_reply) {
      uPayload = event.message.quick_reply.payload;
      console.log("received payload " + uPayload);
    }
    console.log("Message Received from client ");
    User.findOne({fb_id: sender}, function(err, user) {
      if (err) {
        console.log(err)
      } else {
        if (user != null) {
          if (event.message && event.message.text) {
          text = event.message.text;
          var userName = user.name;
          console.log("Message from user" + text);

          normalizedText = text.toLowerCase().replace(' ', '');
          if (normalizedText.startsWith("+") && normalizedText.length ==3) {
            signForSession(sender,userName,normalizedText);
          } else {
            // Handle a text message from this sender
            switch(normalizedText) {
              case "/subs":
                getUserDetails(sender, subscribeUser)
                break;
              case "/unsub":
                unsubscribeUser(sender)
                break;
              case "/substatus":
                subscribeStatus(sender)
                break;
              case "ok":
                signForSession(sender, userName, normalizedText)
                break;
              case "test":
                sendTextMessage2(sender, "testing quick reply")
                break;
              case "help":
                sendTextMessage(sender, "Available commands: \n\n \
                  /subs - to reactivate your subscription \n\n \
                  /substatus - get current subscription status \n\n \
                  /unsub - deactivate subscription (no autoreminders) \n\n \
                  +Fx - signup for nearest Football (x is number of players 0-9) \n\n \
                  +Bx - signup for nearest Basketball (x is number of players 0-9)")
                break;
              default:
                sendTextMessage(sender, "Hi! " + userName + " seems you need to run 'help' command to see possibele actions.")
                //getUserDetails(sender, subscribeUser)
              }
            }
          }
        } else {
          if (event.message && event.message.text) {
            text = event.message.text;
            normalizedText = text.toLowerCase().replace(' ', '');

            switch(normalizedText) {
              case "pass":
                getUserDetails(sender, subscribeUser)
                break;
              default:
                sendTextMessage(sender, "Hello!! I'm BasketBot. I'll help you to signup for Basket or Football sessions. If you know a correct passphrase :)")
                break;
            }
          }
        }
      }
    })
  }
	res.sendStatus(200);
}
*/

function writeSessionToDb (newSessionInfo) {

  Session.findOneAndUpdate({fb_id: newSessionInfo.fb_id, session_type: newSessionInfo.session_type, session_date: newSessionInfo.session_date }, {fb_id: newSessionInfo.fb_id, name: newSessionInfo.name, session_type: newSessionInfo.session_type, players: newSessionInfo.players, session_date: newSessionInfo.session_date}, {upsert:true}, function(err, user) {
    if (err) {
      console.error("Unable save sessions");
    } else {
      console.log('Session saved successfully!');
      var normalisedSessionDate =  newSessionInfo.session_date.toLocaleDateString("en-GB");
      sendTextMessage(newSessionInfo.fb_id, "You've signed for " + newSessionInfo.session_type + " for " + normalisedSessionDate + " number of people " + newSessionInfo.players)
    }
  });

  console.log("got here");
  console.log(newSessionInfo);
}

function signForSession (id, playerName, msg) {
  var ret = new Date();
  ret.setHours(0, 0, 0, 0);
  if (ret.getDay() == 4) {
    ret = ret;
  } else {
    ret.setDate(ret.getDate() + (4 - 1 - ret.getDay() + 7) % 7 + 1);
  }

  var newSession = new Session ({
    fb_id: id,
    name: playerName,
    session_type: "foo",
    players: 0,
    session_date: ret
  });

  switch (msg.substring(1,2)) {
    case "b":
      newSession.session_type = "Basketball"
      newSession.players = Number(msg.substring(2,3))
      writeSessionToDb(newSession)
      break;
    case "f":
      newSession.session_type = "Football"
      newSession.players = Number(msg.substring(2,3))
      writeSessionToDb(newSession)
      break;
    default:
      sendTextMessage(id,"Whoops, somethign went wrong")
      break;
  }

  
  /*Session.findOneAndUpdate({fb_id: newSession.fb_id}, {fb_id: newSession.fb_id, name: newSession.name, session_type: newSession.session_type, players: newSession.players, session_date: newSession.session_date}, {upsert:true}, function(err, user) {
    if (err) {
      console.error("Unable save sessions");
    } else {
      console.log('Session saved successfully!');
      sendTextMessage(newSession.fb_id, "You've been signedup!")
    }
  });*/
}


function getUserDetails(id, callback)  {
  request({
    uri: properties.facebook_api+id,
    qs: { fields:'first_name,last_name',access_token: properties.facebook_token },
    method: 'GET',
    json: true

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var name = body.first_name
      var lastName = body.last_name
      var fullName = name + " " + lastName
      console.log("From GetUserDetails " + fullName);
      callback(id,fullName);
    } else {
      console.log(response.statusCode)
      console.error(error);
    }
  });  
}

function subscribeUser(id,fullName) {
  console.log('subscribe execution started');
  // create a new user
  var newUser = new User({
    fb_id: id,
    name: fullName
  });
  console.log('after constr' + newUser.name);

  // call the built-in save method to save to the database
  User.findOneAndUpdate({fb_id: newUser.fb_id}, {fb_id: newUser.fb_id, name: newUser.name, sub_status: true}, {upsert:true}, function(err, user) {
    if (err) {
      sendTextMessage(id, "There wan error subscribing you");
    } else {
      console.log('User saved successfully!');
      subscribedText = newUser.name + " You've been subscribed!"
      sendTextMessage(newUser.fb_id, subscribedText)
    }
  });
}

function unsubscribeUser(id) {
  //set sub_status to false
   User.findOneAndUpdate({fb_id: id}, {sub_status: false}, function(err, user) { 
    if (err) {
      sendTextMessage(id, "There wan error unsubscribing you.");
    } else {
      sendTextMessage(id, "You've been unsubscribed!")
    }
  });
}

function whoWillPlay (id) {
  Session.find({}, function(err, users) {
    if (err) {
      console.log(err)
    } else {
      if (users != null) {
        console.log("got Users " + users)
        var playersList = [];
        users.forEach(function(user){
          toArray = user.name + " " + user.players
          console.log("details ===========" + toArray)
          playersList.push(toArray);
        })
        prepMsg = playersList.join("\n")
        sendTextMessage(id, prepMsg)
      }
    }
  })
}

function subscribeStatus(id) {
  User.findOne({fb_id: id}, function(err, user) {
    subscribeStatus = false
    if (err) {
      console.log(err)
    } else {
      if (user != null) {
        subscribeStatus = true
      }
      subscribedText = "Your subscribed status is " + subscribeStatus
      sendTextMessage(id, subscribedText)
    }
  })
}

function sendTextMessage2(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText,
      "quick_replies":[
      {
        "content_type":"text",
        "title":"Basket +1",
        "payload":"+b1"
        //"image_url":"http://example.com/img/red.png"
      },
      {
        "content_type":"text",
        "title":"Not Going",
        "payload":"+b0"
        //"image_url":"http://example.com/img/red.png"
      }
    ]
    }
  };

  callSendAPI(messageData);
}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: properties.facebook_message_endpoint,
    qs: { access_token: properties.facebook_token },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.log(response.statusCode)
      console.error("Unable to send message.");
      //console.error(response);
      console.error(error);
    }
  });
}