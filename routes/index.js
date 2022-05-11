var express = require('express');
var router = express.Router();
var User = require('../models/user');
const Withdrawal = require('../models/withdrawal');
var Investments = require('../models/investments');
const middleware = require('../middleware/index');
const fetch = require('node-fetch');
const moment = require('moment');
const unique = require('unique-slug');
const Wallet = require('../models/wallet');
const Notification = require('../models/notification');
const validate = require('bitcoin-address-validation')
const sendEmail = require('../helpers/SendEmail');


router.get('/', function (req, res) {
  res.render('index');
});
router.get('/faq', function (req, res) {
  res.render('faq');
});
router.get('/contact', function (req, res) {
  res.render('contact');
});

router.get('/terms', function (req, res) {
  res.render('calculator');
});


router.get('/plan', middleware.isLoggedIn, function (req, res) {
  res.render('dashboard/plans');
});

router.get('/invest', middleware.isLoggedIn, function (req, res) {
  let plan = {};
  if (req.query.starter == 'on') {
    plan = {
      name: 'Starter Plan',
      term: '30',
      profit: 10,
      min: 100,
      max: 4999,
      tag: 'Invest for 30 and get 10% every 10 days profit',
      start: moment().format('MM-DD-YYYY'),
      end: moment().add(30, 'days').format('MM-DD-YYYY'),
    };
  } else if (req.query.silver == 'on') {
    plan = {
      name: 'Silver Plan',
      term: '60',
      profit: 15,
      min: 5000,
      max: 49999,
      tag: 'Invest for 60 days and get 15% every 10 days profit',
      start: moment().format('MM-DD-YYYY'),
      end: moment().add(60, 'days').format('MM-DD-YYYY'),
    };
  } else {
    plan = {
      name: 'Diamond Plan',
      term: '90',
      profit: 20,
      min: 50000,
      max: 200000,
      tag: 'Invest for 90 days and get 20% every 10 days profit',
      start: moment().format('MM-DD-YYYY'),
      end: moment().add(90, 'days').format('MM-DD-YYYY'),
    };
  }
  res.render('dashboard/invest', { plan });
});


router.post('/invest', middleware.isLoggedIn, (req, res) => {
  let end = '';
  let amount = req.body.amount1 || req.body.amount
  let percentage = 0;
  if (req.user.userStatus !== 'Verified') {
    req.flash('error', 'User is not Verified check your Email for our verification email or contact Support');
    return res.redirect('back');
  }
  if (req.body.plan == 'Diamond Plan') {
    end = moment().add(90, 'dayss').format('MM-DD-YYYY');
    percentage = 1.8;
  }
  if (req.body.plan == 'Silver Plan') {
    end = moment().add(60, 'days').format('MM-DD-YYYY');
    percentage = 0.9;
  }
  if (req.body.plan == 'Starter Plan') {
    end = moment().add(30, 'days').format('MM-DD-YYYY');
    percentage = 0.30;
  }
  if (req.body.plan == 'Diamond Plan' && amount < 50000) {
    req.flash('error', 'Minimum Investment for selected plan is $50000')
    return res.redirect('back')
  }
  if (req.body.plan == 'Silver Plan' && (amount < 5000 || amount > 49999)) {
    req.flash('error', 'Investment for selected plan is between $5000 and $49999')
    return res.redirect('back')
  }
  if (req.body.plan == 'Starter Plan' && (amount < 100 || amount > 4999)) {
    req.flash('error', 'Investment for selected plan is between $100 and $4999')
    return res.redirect('back')
  }
  if (req.body.pin == req.user.pin) {
    let invest = {
      plan: req.body.plan,
      title: `IVN - ${unique()}`,
      amount: amount,
      status: 'active',
      approvedAt: moment().format('MM-DD-YYYY'),
      endDate: end,
      percentage,
    };
    if (req.user.balance < invest.amount || req.user.balance == 0) {
      req.flash('error', 'Insufficient Balance. Please fund your wallet to make this Transaction');
      return res.redirect('back');
    }
    Investments.create(invest, function (err, investment) {
      if (err) {
        console.log(err);
      }
      investment.user.id = req.user.id;
      investment.user.username = req.user.username;
      investment.user.firstname = req.user.firstname;
      investment.user.lastname = req.user.lastname
      User.findById(req.user.id, (err, user) => {
        user.balance = user.balance - invest.amount

        if (req.user.referral && user.referralPaid != true) {
          user.referralPaid = true
          User.findOne({ 'referralId': req.user.referral }, (err, user, next) => {
            if (err) {
              console.log(err)
              next()
            }
            user.refEarned = user.refEarned + (invest.amount / 10)
            user.balance = user.balance + user.refEarned
            user.save()
          })
        }
        user.save()
      })

      investment.save();
      Notification.create({}, (err, notification) => {
        if (err) {

        }
        notification.message = `your investment of $${invest.amount} was successful`
        notification.user.id = req.user.id
        notification.save()
      })
      sendEmail({
        email: req.user.username,
        subject: 'Update on your Investment on Acecoins',
        message: `<!DOCTYPE html>
        <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
            xmlns:o="urn:schemas-microsoft-com:office:office">
        
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="x-apple-disable-message-reformatting">
            <title></title>
        
            <link href="https://fonts.googleapis.com/css?family=Roboto:400,600" rel="stylesheet" type="text/css">
            <!-- Web Font / @font-face : BEGIN -->
            <!--[if mso]>
                <style>
                    * {
                        font-family: 'Roboto', sans-serif !important;
                    }
                </style>
            <![endif]-->
        
            <!--[if !mso]>
                <link href="https://fonts.googleapis.com/css?family=Roboto:400,600" rel="stylesheet" type="text/css">
            <![endif]-->
        
            <!-- Web Font / @font-face : END -->
        
            <!-- CSS Reset : BEGIN -->
        
        
            <style>
                /* What it does: Remove spaces around the email design added by some email clients. */
                /* Beware: It can remove the padding / margin and add a background color to the compose a reply window. */
                html,
                body {
                    margin: 0 auto !important;
                    padding: 0 !important;
                    height: 100% !important;
                    width: 100% !important;
                    font-family: 'Roboto', sans-serif !important;
                    font-size: 14px;
                    margin-bottom: 10px;
                    line-height: 24px;
                    color: #8094ae;
                    font-weight: 400;
                }
        
                * {
                    -ms-text-size-adjust: 100%;
                    -webkit-text-size-adjust: 100%;
                    margin: 0;
                    padding: 0;
                }
        
                table,
                td {
                    mso-table-lspace: 0pt !important;
                    mso-table-rspace: 0pt !important;
                }
        
                table {
                    border-spacing: 0 !important;
                    border-collapse: collapse !important;
                    table-layout: fixed !important;
                    margin: 0 auto !important;
                }
        
                table table table {
                    table-layout: auto;
                }
        
                a {
                    text-decoration: none;
                }
        
                img {
                    -ms-interpolation-mode: bicubic;
                }
            </style>
        
        </head>
        
        <body width="100%" style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: #f5f6fa;">
            <center style="width: 100%; background-color: #f5f6fa;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f5f6fa">
                    <tr>
                        <td style="padding: 40px 0;">
                            <table style="width:100%;max-width:620px;margin:0 auto;">
                                <tbody>
        
                                </tbody>
                            </table>
                            <table style="width:100%;max-width:620px;margin:0 auto;background-color:#ffffff;">
                                <tbody>
                                    <tr>
                                        <td style="text-align:center;padding: 30px 30px 15px 30px;">
                                            <h2 style="font-size: 18px; color: #1ee0ac; font-weight: 600; margin: 0;">Deposit
                                                successful</h2>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="text-align:center;padding: 0 30px 20px">
                                            <p style="margin-bottom: 10px;">Hi ${req.user.firstname},</p>
                                            <p>Your investment of $${invest.amount} has been approved. This can be managed from your Plans section.</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="text-align:center;padding: 0 30px 40px">
                                            <p style="margin: 0; font-size: 13px; line-height: 22px; color:#9ea8bb;">This is an
                                                automatically generated email please do not reply to this email. If you face any
                                                issues, please contact us at admin@acecoins.uk</p>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
        
                        </td>
                    </tr>
                </table>
            </center>
        </body>
        
        </html>`
      })
      res.render('dashboard/invest-confirm', {
        amount: invest.amount,
        plan: invest.plan,
        id: investment.id
      });
    });

  } else {
    req.flash('error', 'incorrect pin');
    res.redirect('back');
  }
});

router.get('/me/plans', middleware.isLoggedIn, function (req, res) {
  Investments.find({ 'user.id': req.user.id }).exec((err, investments) => {
    if (err) {
      req.flash('error', err.message);
    }
    var count = investments.length;
    investments.forEach((investment) => {

    });
    let activeInvestment = investments.filter((investment) => {
      return investment.status == 'active';
    });
    let investmentAmount = investments.map((investment) => {
      return investment.amount;
    });
    if (investmentAmount.length > 0) {
      investmentAmount = investmentAmount.reduce(
        (total, amount) => total + amount
      );
    } else {
      investmentAmount = 0;
    }

    let activeAmount = activeInvestment.map((investment) => {
      return investment.amount;
    });
    if (activeAmount.length > 0) {
      activeAmount = activeAmount.reduce((total, amount) => total + amount);
    } else {
      activeAmount = 0;
    }

    let maturedInvestment = investments.filter((investment) => {
      return investment.isMatured == true;
    });
    if (count === undefined) {
      count = 0;
    }
    res.render('dashboard/income', {
      investments,
      investmentAmount,
      activeAmount,
      activeInvestment,
      maturedInvestment,
    });
  });
});

router.get('/investment/:investmentId', middleware.isLoggedIn, (req, res) => {
  Investments.findOne({ '_id': req.params.investmentId }, (err, investment) => {
    if (err) {
      console.log(err)
    }
    res.render('dashboard/invest-details', { investment })
  })
})

router.get('/dashboard', middleware.isLoggedIn, (req, res) => {
  User.find({ referral: req.user.referralId })
    .exec()
    .then((refs) => {
      Investments.find({ 'user.id': req.user.id }).exec((err, investments) => {
        if (err) {
          req.flash('error', err.message);
        }
        var count = investments.length;
        investments.forEach((investment) => {

        });
        let activeInvestment = investments.filter((investment) => {
          return investment.status == 'active';
        });
        let investmentAmount = investments.map((investment) => {
          return investment.amount;
        });
        if (investmentAmount.length > 0) {
          investmentAmount = investmentAmount.reduce(
            (total, amount) => total + amount
          );
        } else {
          investmentAmount = 0;
        }

        let activeAmount = activeInvestment.map((investment) => {
          return investment.amount;
        });
        if (activeAmount.length > 0) {
          activeAmount = activeAmount.reduce((total, amount) => total + amount);
        } else {
          activeAmount = 0;
        }

        if (count === undefined) {
          count = 0;
        }
        refscount = refs.length;
        res.render('dashboard/dashboard', {
          refCount: refscount,
          investment: count,
          investments,
          active: activeInvestment.length,
          investmentAmount,
          activeInvestment,
          activeAmount,
          sitename: process.env.SITENAME
        });
      });
    });
});

router.get('/wallet/deposit', middleware.isLoggedIn, (req, res) => {
  res.render('dashboard/fund-wallet')
})
router.post('/wallet/deposit', middleware.isLoggedIn, (req, res) => {
  var amount = Number(req.body.amount1) || Number(req.body.amount);
  var orderid = req.user.username;
  var amountBTC;

  const api = '5PZGDEG-92T4C3S-GMG7BM6-KJ50PG7';

  fetch(
    'https://api.nowpayments.io/v1/estimate?amount=' +
    amount +
    '.5000&currency_from=usd&currency_to=btc',
    {
      method: 'get',
      headers: { 'x-api-key': api },
    }
  )
    .then((res) => res.json())
    .then((json) => (amountBTC = json.estimated_amount));

  const body = {
    price_amount: amount,
    price_currency: 'usd',
    pay_amount: amountBTC,
    pay_currency: 'btc',
    order_id: orderid,
    order_description: 'Payment for Acecoins',
  };
  fetch('https://api.nowpayments.io/v1/payment', {
    method: 'post',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', 'x-api-key': api },
  })
    .then((res) => res.json())
    .then((json) => {

      Wallet.create({}, (err, wallet) => {
        if (err) {
          console.log(err)
        }
        wallet.transactionId = json.payment_id
        wallet.user.id = req.user.id
        wallet.save()
      })
      res.render('dashboard/payment-instruction', {
        payment_id: json.payment_id,
        pay_address: json.pay_address,
        pay_amount: json.pay_amount,
        amount: json.price_amount,
      })
    }

    );
});

router.get('/wallet/withdraw', middleware.isLoggedIn, (req, res) => {
  res.render('dashboard/withdrawal')
})

router.post('/wallet/withdraw', middleware.isLoggedIn, function (req, res) {
  let amount = req.body.amount1 || req.body.amount
  if (!amount || amount < 1) {
    req.flash('error', 'Amount must be greater than $0');
    return res.redirect('back');
  }
  if (!validate(req.body.address)) {
    req.flash('error', 'Enter a valid BTC address');
    return res.redirect('back');
  }
  if (Number(req.body.pin) !== req.user.pin) {
    req.flash('error', 'incorrect pin');
    return res.redirect('back');
  }
  if ((req.user.balance) < amount) {
    req.flash('error', 'You do not have sufficient balance');
    res.redirect('back');
  } else {
    let balance = req.user.balance - amount;
    User.updateOne(
      { username: req.user.username },
      { balance: balance },
      (err, user) => { }
    );
    Withdrawal.create({}, function (err, request) {
      request.amount = amount,
        request.address = req.body.address,
        request.user.id = req.user.id,
        request.user.username = req.user.username;
      request.user.firstname = req.user.firstname;
      request.user.lastname = req.user.lastname;
      request.save();
      sendEmail({
        email: req.user.username,
        subject: 'Update on your Withdrawal on Acecoins',
        message: `<!DOCTYPE html>
        <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
            xmlns:o="urn:schemas-microsoft-com:office:office">
        
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="x-apple-disable-message-reformatting">
            <title></title>
        
            <link href="https://fonts.googleapis.com/css?family=Roboto:400,600" rel="stylesheet" type="text/css">
            <!-- Web Font / @font-face : BEGIN -->
            <!--[if mso]>
                <style>
                    * {
                        font-family: 'Roboto', sans-serif !important;
                    }
                </style>
            <![endif]-->
        
            <!--[if !mso]>
                <link href="https://fonts.googleapis.com/css?family=Roboto:400,600" rel="stylesheet" type="text/css">
            <![endif]-->
        
            <!-- Web Font / @font-face : END -->
        
            <!-- CSS Reset : BEGIN -->
        
        
            <style>
                /* What it does: Remove spaces around the email design added by some email clients. */
                /* Beware: It can remove the padding / margin and add a background color to the compose a reply window. */
                html,
                body {
                    margin: 0 auto !important;
                    padding: 0 !important;
                    height: 100% !important;
                    width: 100% !important;
                    font-family: 'Roboto', sans-serif !important;
                    font-size: 14px;
                    margin-bottom: 10px;
                    line-height: 24px;
                    color: #8094ae;
                    font-weight: 400;
                }
        
                * {
                    -ms-text-size-adjust: 100%;
                    -webkit-text-size-adjust: 100%;
                    margin: 0;
                    padding: 0;
                }
        
                table,
                td {
                    mso-table-lspace: 0pt !important;
                    mso-table-rspace: 0pt !important;
                }
        
                table {
                    border-spacing: 0 !important;
                    border-collapse: collapse !important;
                    table-layout: fixed !important;
                    margin: 0 auto !important;
                }
        
                table table table {
                    table-layout: auto;
                }
        
                a {
                    text-decoration: none;
                }
        
                img {
                    -ms-interpolation-mode: bicubic;
                }
            </style>
        
        </head>
        
        <body width="100%" style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: #f5f6fa;">
            <center style="width: 100%; background-color: #f5f6fa;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f5f6fa">
                    <tr>
                        <td style="padding: 40px 0;">
                            <table style="width:100%;max-width:620px;margin:0 auto;">
                                <tbody>
        
                                </tbody>
                            </table>
                            <table style="width:100%;max-width:620px;margin:0 auto;background-color:#ffffff;">
                                <tbody>
                                    <tr>
                                        <td style="text-align:center;padding: 30px 30px 15px 30px;">
                                            <h2 style="font-size: 18px; color: #1ee0ac; font-weight: 600; margin: 0;">Withdrawal
                                                Requested</h2>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="text-align:center;padding: 0 30px 20px">
                                            <p style="margin-bottom: 10px;">Hi ${req.user.firstname},</p>
                                            <p>Your Withdrawal of $${amount} is been proccessed. Your payment will be sent to the bitcoin address ${req.body.address}.</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="text-align:center;padding: 0 30px 40px">
                                            <p style="margin: 0; font-size: 13px; line-height: 22px; color:#9ea8bb;">This is an
                                                automatically generated email please do not reply to this email. If you face any
                                                issues, please contact us at admin@acecoins.uk</p>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
        
                        </td>
                    </tr>
                </table>
            </center>
        </body>
        
        </html>`
      })
    });
    Notification.create({}, (err, notification) => {
      if (err) {

      }
      notification.message = `your Withdrawal  of $${amount} was requested`
      notification.user.id = req.user.id
      notification.save()
    })
    req.flash(
      'success',
      'Withdraw successful. processing may take up to 24 hours'
    );
    res.redirect('back');
  }
});



router.get('/history', middleware.isLoggedIn, (req, res) => {
  Withdrawal.find({}, (err, withdrawals) => {
    withdrawals = withdrawals.filter(withdrawal => {
      return withdrawal.user.username == req.user.username
    })
    res.render('dashboard/withdrawal-history', { withdrawals })
  })

})


module.exports = router;
