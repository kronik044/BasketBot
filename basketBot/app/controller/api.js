//api.js
var request = require('request');
var properties = require('../config/properties.js')

// if our user.js file is at app/models/user.js
var User = require('../model/user');

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
    console.log('msg received')
    User.findOne({fb_id: sender}, function(err, user) {
      if (err) {
        console.log(err)
      } else {
        if (user != null) {
          if (event.message && event.message.text) {
          text = event.message.text;

          normalizedText = text.toLowerCase().replace(' ', '');
          
          // Handle a text message from this sender
          switch(normalizedText) {
            case "/subs":
              getUserDetails(sender, subscribeUser)
              break;
            case "/unsub":
              unsubscribeUser(sender)
              break;
            case "/subscribestatus":
              subscribeStatus(sender)
              break;
            default:
              sendTextMessage(sender, "Hi! ")
              //getUserDetails(sender, subscribeUser)
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
                sendTextMessage(sender, "Hi! You are not subscribed and only subscribed users may use this bot")
                break;
            }
          }
        }
      }
    })
  }
	res.sendStatus(200);
}

/*
exports.handleMessage = function(req, res) {
  messaging_events = req.body.entry[0].messaging;
  for (i = 0; i < messaging_events.length; i++) {
    event = req.body.entry[0].messaging[i];
    sender = event.sender.id;
    if (event.message && event.message.text) {
        text = event.message.text;

        normalizedText = text.toLowerCase().replace(' ', '');
        
        // Handle a text message from this sender
        switch(normalizedText) {
          case "/subscribe":
            subscribeUser(sender)
            break;
          case "/unsubscribe":
            unsubscribeUser(sender)
            break;
          case "/subscribestatus":
            subscribeStatus(sender)
            break;
          default:
            sendTextMessage(sender, "Hi! ")
            //getUserDetails(sender, subscribeUser)
          }
      }
    }
  res.sendStatus(200);
}*/

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
      sendTextMessage(id, "There wan error subscribing you for daily articles");
    } else {
      console.log('User saved successfully!');
      subscribedText = newUser.name + " You've been subscribed!"
      sendTextMessage(newUser.fb_id, subscribedText)
    }
  });
}

function unsubscribeUser(id) {
  // call the built-in save method to save to the database
  //User.findOneAndRemove({fb_id: id}, function(err, user) {
   User.findOneAndUpdate({fb_id: newUser.fb_id}, {sub_status: true}, function(err, user) { 
    if (err) {
      sendTextMessage(id, "There wan error unsubscribing you for daily articles");
    } else {
      console.log('User deleted successfully!');
      sendTextMessage(id, "You've been unsubscribed!")
    }
  });
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