var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var mongoose = require('mongoose');

var schedule = require('node-schedule');
var User = require('./app/model/user');
var Session = require('./app/model/session');
var apiController = require('./app/controller/api');

var routes = require('./app/routes/index');
var users = require('./app/routes/users');
var webhooks = require('./app/routes/webhooks');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'app', 'views'));
app.set('view engine', 'jade');

//mongoose.connect('mongodb://localhost/test');

mongoose.connect('mongodb://localhost/test', {
  useMongoClient: true,
});


/* 
This code was used for tests of schemas. remove later
User.findOneAndUpdate({fb_id: "test_id"}, {fb_id: "test_id", name: "User_test_name", sub_status: true}, {upsert:true}, function(err, user) {
    if (err) {
      console.error("Unable save user to users");
    } else {
      console.log('User saved successfully!');
      testInsert();
    }
  });


function testInsert () {
  Session.findOneAndUpdate({fb_id: "test_id"}, {fb_id: "test_id", name: "Session_test_name", session_type: "Football", players: 20}, {upsert:true}, function(err, user) {
    if (err) {
      console.error("Unable save sessions");
    } else {
      console.log('Session saved successfully!');
    }
  });
}*/


//*/1 * * * *

/*var j = schedule.scheduleJob('*1 * * * *', function(){
  User.find({}, function(err, users) {
      if (users != null) {
          users.forEach(function(user){
            apiController._sendTextMessage2(user.fb_id, "Sign for next session?")
          });
      }
    });
});*/


var j = schedule.scheduleJob('*/1 * * * *', function(){
  User.find({}, function(err, users) {
    if (err) {
      console.log(err)
    } else {
        if (users != null) {
          users.forEach(function(user){
            Session.find({fb_id: user.fb_id}, function(err, sessions) {
              if (err) {
                console.log(err)
              } else {
                  if (sessions != null) {
                    sessions.forEach(function(session){
                      apiController._sendTextMessage2(session.fb_id, "Sign for next session? " + session.session_type)
                    });
                  }
                }
              });
          });
        }
      }
    });
});


  


/*
var j = schedule.scheduleJob('*1 * * * *', function(){
  User.find({}, function(err, users) {
      if (users !== null) {
          users.forEach(function(user){
            Session.findOne({fb_id: user.fb_id}, function(err,sessions) {
            if (sessions !== null) {
              sessions.forEach(function(session){
                apiController._sendTextMessage2(session.fb_id, "Sign for next session? " + session.session_type);
              });
            }
            });
          });
      }
    });
});*/



// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'app', 'public')));

app.use('/', routes);
app.use('/users', users);
app.use('/webhook', webhooks);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
