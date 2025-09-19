// models/User.js
const mongoose = require('mongoose');
const plm=require("passport-local-mongoose")

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
  },
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'post'
  }],
  dp: {
    type: String, // URL to the display picture
    default: ''
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  fullname: {
    type: String,
    required: true,
    trim: true
  },
  image:{
    type:String,
    default:"default.png"
  },
  description:{
    type:String,
    default:"no bio added"
  }
}, 
{
  timestamps: true // Adds createdAt and updatedAt fields
});

userSchema.plugin(plm);

module.exports = mongoose.model('user', userSchema);
