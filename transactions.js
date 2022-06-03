const Investments = require("./models/investments");
const User = require("./models/user");
const moment = require("moment");

const addinterest = function addInterest() {
  Investments.find({}).exec((err, investment) => {
    if (err) {
      console.log(err);
    }

    investment.forEach(async (invest) => {
      if (invest.amount <= 4999 && invest.interest.length < 3) {
        let interests;
        let period = invest.interest.length + 1;
        if (
          moment().format("MM-DD-YYYY") ==
          moment(invest.approvedAt).add(period, "months").format("MM-DD-YYYY")
        ) {
          interests = invest.amount * 0.1;
          invest.interest.push(interests);
          User.findById(invest.user.id, async (err, user) => {
            user.profit += interests;
            user.balance += interests;
            await user.save();
          });
          await invest.save();
        }
      } else if (
        invest.amount >= 5000 &&
        invest.amount <= 49999 &&
        invest.interest.length < 6
      ) {
        let interests;
        let period = invest.interest.length + 1;
        if (
          moment().format("MM-DD-YYYY") ==
          moment(invest.approvedAt).add(period, "months").format("MM-DD-YYYY")
        ) {
        }
      } else if (invest.amount >= 50000 && invest.interest.length < 9) {
        let interests;
        let period = invest.interest.length + 1;
        if (
          moment().format("MM-DD-YYYY") ==
          moment(invest.approvedAt).add(period, "months").format("MM-DD-YYYY")
        ) {
          interests = invest.amount * 0.2;
          invest.interest.push(interests);
          //change
          User.findById(invest.user.id, async (err, user) => {
            user.profit += interests;
            user.balance += interests;
            await user.save();
          });
          await invest.save();
        }
      }
    });
    //console.log(investment);
  });
};

const matureinvestment = function matureInvestment() {
  Investments.find({}).exec((err, investments) => {
    if (err) {
      console.log(err);
    }

    investments.forEach((investment) => {
      if (
        investment.amount < 5000 &&
        investment.interest.length == 3 &&
        investment.isMatured == false
      ) {
        User.findById(investment.user.id, async (err, user) => {
          user.balance += Number(investment.amount);
          investment.isMatured = true;
          await investment.save();
          await user.save();
        });
      } else if (
        investment.amount >= 5000 &&
        investment.amount > 50000 &&
        investment.length == 6 &&
        investment.isMature === false
      ) {
        User.findById(investment.user.id, async (err, user) => {
          user.balance += Number(investment.amount);
          investment.isMatured = true;
          await investment.save();
          await user.save();
        });
      } else if (
        investment.amount >= 50000 &&
        investment.length == 9 &&
        investment.isMature === false
      ) {
        User.findById(investment.user.id, async (err, user) => {
          user.balance += Number(investment.amount);
          investment.isMatured = true;
          await investment.save();
          await user.save();
        });
      }
    });
  });
};

module.exports = {
  addinterest,
  matureinvestment,
};
