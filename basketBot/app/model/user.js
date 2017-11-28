//user.js
// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var userSchema = new Schema({
  name: String,
  fb_id: { type: String, required: true, unique: true },
},
{
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// the schema is useless so far
// we need to create a model using it
var User = mongoose.model('User', userSchema);

/*userSchema.pre('update', function(next) {
  console.log('pre save')
  // get the current date
  var currentDate = new Date();
  
  // change the updated_at field to current date
  this.updated_at = currentDate;

  // if created_at doesn't exist, add to that field
  if (!this.created_at)
    this.created_at = currentDate;

  next();
});*/

// make this available to our users in our Node applications
module.exports = User;