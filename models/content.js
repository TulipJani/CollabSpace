const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  workspaceName: {
    type: String,
    required: true
  }
});

const Content = mongoose.model('Content', contentSchema);

module.exports = Content;
