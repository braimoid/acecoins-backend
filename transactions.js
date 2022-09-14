const Investments = require("./models/investments");
const User = require("./models/user");
const moment = require("moment");

const addinterest = function addInterest() {
  Investments.find({}).exec((err, investment) => {
    if (err) {
      console.log(err);
    }

    investment.forEach(async (invest) => {
      // console.log(invest)
      if (invest.amount <= 4999 && invest.interest.length < 3) {
        let interests;
        let period = invest.interest.length + 1;
        let nextdays = period * 10;
        // console.log(invest)
        if (
          moment().format("MM-DD-YYYY") >=
          moment(new Date(invest.approvedAt))
            .add(nextdays, "days")
            .format("MM-DD-YYYY")
        ) {
          // console.log(invest.user.username);
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
        let nextdays = period * 10;
        if (
          moment().format("MM-DD-YYYY") >=
          moment(new Date(invest.approvedAt))
            .add(nextdays, "days")
            .format("MM-DD-YYYY")
        ) {
          interests = invest.amount * 0.1;
          invest.interest.push(interests);
          User.findById(invest.user.id, async (err, user) => {
            user.profit += interests;
            user.balance += interests;
            await user.save();
          });
          await invest.save();CT
        }
      } else if (invest.amount >= 50000 && invest.interest.length < 9) {
        let interests;
        let period = invest.interest.length + 1;
        let nextdays = period * 10;
        if (
          moment().format("MM-DD-YYYY") >=
          moment(new Date(invest.approvedAt))
            .add(nextdays, "days")
            .format("MM-DD-YYYY")
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
    // console.log(investment);
  });
};

const matureinvestment = function matureInvestment() {
  Investments.find({}).exec((err, investments) => {
    if (err) {
      console.log(err);
    }

    investments.forEach((investment) => {
      // console.log(investment);

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
        investment.amount < 50000 &&
        investment.interest.length == 6 &&
        investment.isMatured === false
      ) {
        User.findById(investment.user.id, async (err, user) => {
          user.balance += Number(investment.amount);
          investment.isMatured = true;
          await investment.save();
          await user.save();
        });
      } else if (
        investment.amount >= 50000 &&
        investment.interest.length == 9 &&
        investment.isMatured === false
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
