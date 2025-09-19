// models/Post.js

const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  imageText: {
    type: String,
    // required: true,
    trim: true
  },
  image:{
    type:String,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  likes: {
    type: Array, // array of user IDs or usernames
    default: []
  }
});

module.exports =mongoose.model('post', postSchema);
