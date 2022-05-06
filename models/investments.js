const mongoose = require('mongoose');
const moment = require('moment');

Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

const InvestmentSchema = new mongoose.Schema({
  plan: String,
  title: String,
  amount: Number,
  status: String,
  percentage: Number,
  isMatured: { type: Boolean, default: false },
  isMaturable: { type: Boolean, default: true },
  interest: [{ type: Number }],
  user: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    username: String,
    firstname: String,
    lastname: String
  },
  endDate: { type: String },
  createdAt: { type: Date, default: Date.now() },
  approvedAt: { type: String },
});

mongoose.models = {};
module.exports = mongoose.model('Investment', InvestmentSchema);
