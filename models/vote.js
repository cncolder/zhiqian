var mongoose = require('./mongoose');

var schema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['outlets'],
    required: true
  },

  code: {
    type: String,
    match: /^\d{3}$/,
    required: true
  },

  wxid: {
    type: String,
    unique: true
  },
  
  ip: {
    type: String,
    match: /^(?:\d{1,3}\.){3}\d{1,3}$/,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Vote', schema);
