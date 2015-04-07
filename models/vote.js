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

  ip: {
    type: String,
    match: /^(?:\d{1,3}\.){3}\d{1,3}$/,
    required: true,
    unique: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Vote', schema);
