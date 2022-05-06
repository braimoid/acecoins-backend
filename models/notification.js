const mongoose = require('mongoose')

const NotificationSchema = new mongoose.Schema({
  message: { type: String },
  user: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }
  },
  createdAt: { type: Date, default: Date.now }
})

mongoose.models = {};
module.exports = mongoose.model('notification', NotificationSchema);