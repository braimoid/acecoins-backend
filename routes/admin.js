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
const cron = require('node-cron');
const validate = require('bitcoin-address-validation')
const sendEmail = require('../helpers/SendEmail');
const user = require('../models/user');


function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};


router.get('/admin', middleware.isAdmin, (req, res) => {
    Investments.find({}).exec((err, investments) => {
        if (err) {
            req.flash('error', err.message);
        }
        var count = investments.length;
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
        Withdrawal.find({}, (err, withdrawals) => {
            let withdrawalsAmount = withdrawals.map((withdrawal) => {
                return withdrawal.amount
            })
            if (withdrawalsAmount.length > 0) {
                withdrawalsAmount = withdrawalsAmount.reduce(
                    (total, amount) => total + amount
                );
            } else {
                withdrawalsAmount = 0;
            }

            let PaidWithdrawal = withdrawals.filter((withdrawal) => {
                return withdrawal.status == 'Paid'
            })
            PaidWithdrawal = PaidWithdrawal.map((investment) => {
                return investment.amount;
            });
            if (PaidWithdrawal.length > 0) {
                PaidWithdrawal = PaidWithdrawal.reduce(
                    (total, amount) => total + amount
                );
            } else {
                PaidWithdrawal = 0;
            }


            res.render('admin/index', {
                count,
                investments,
                withdrawalsAmount,
                investmentAmount,
                activeAmount,
                activeInvestment,
                maturedInvestment,
                PaidWithdrawal,
            });

        })
    });
})

router.get('/manage/pause/:investmentId', middleware.isAdmin, (req, res) => {
    Investments.findById(req.params.investmentId, (err, investment) => {
        investment.isMaturable = false
        investment.save()
    })
    req.flash(
        'success',
        'INvestment has been updated, will not mature'
    );
    res.redirect('back');
})

router.get('/manage/cancel/:investmentId', middleware.isAdmin, (req, res) => {
    Investments.findById(req.params.investmentId, (err, investment) => {
        investment.status = 'cancelled'
        investment.isMaturable = false
        User.findById(investment.user.id, (err, user) => {
            user.balance += investment.amount / 2
            user.save()
        })
        Notification.create({}, (err, notification) => {
            if (err) {

            }
            notification.message = `your investment with id ${investment.title} of $${investment.amount} was cancelled`
            notification.user.id = investment.user.id
            notification.save()
        })
        Notification.create({}, (err, notification) => {
            if (err) {

            }
            notification.message = `$${investment.amount / 2} was credited to your wallet`
            notification.user.id = investment.user.id
            notification.save()
        })
        investment.save()

    })
    req.flash(
        'success',
        'Investment has been updated, Investment will not accumulate Profit'
    );
    res.redirect('back');
})

router.get('manage/reactivate/=investment.id', middleware.isAdmin, (req, res) => {
    Investments.findById(req.params.investmentId, (err, investment) => {
        investment.isMaturable = true
        investment.save()
    })
    req.flash(
        'success',
        'INvestment has been updated, Investment will not accumulate Profit'
    );
    res.redirect('back');
})

router.get('/admin/users', middleware.isAdmin, (req, res) => {
    const search = req.query.search
    if (req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');

        User.find({ username: regex }, (err, users) => {
            if (err) {
                console.log(err)
                res.redirect('back')
            }
            res.render('admin/list-user', { users: users })
        })
    } else {
        User.find({}, function (err, users) {
            if (err) {
                console.log(err)
            }
            res.render('admin/list-user', { users: users })
        })
    }
})

router.get('/admin/withdrawals', middleware.isAdmin, (req, res) => {
    if (req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Withdrawal.find({}, (err, withdrawals) => {
            withdrawals.filter(withdrawal => {
                return withdrawal.user.username == regex
            })
            res.render('admin/request', { withdrawals })
        })
    } else {
        Withdrawal.find({}, (err, withdrawals) => {
            res.render('admin/request', { withdrawals })
        })
    }
})

router.get('/admin/deactivate/:userId', middleware.isAdmin, (req, res) => {
    User.findById(req.params.userId, (err, user) => {
        user.userStatus = 'Deactivated'
        user.save()
        req.flash(
            'success',
            'User has been deactivated'
        );
        res.redirect('back');
    })
})
router.get('/admin/activate/:userId', middleware.isAdmin, (req, res) => {
    User.findById(req.params.userId, (err, user) => {
        user.userStatus = 'Verified'
        user.save()
        req.flash(
            'success',
            'User has been Verified'
        );
        res.redirect('back');
    })
})

router.get('/admin/investments/:userId', middleware.isAdmin, (req, res) => {
    Investments.find({ 'user.id': req.params.userId }, (err, investments) => {

        res.render('admin/manage-invest', { investments })
    })
})

router.get('/admin/withdrawal/decline/:withdrawalId', middleware.isAdmin, (req, res) => {
    Withdrawal.findById(req.params.withdrawalId, (err, request) => {
        request.status = 'Decline'
        User.findById(request.user.id, (err, user) => {
            console.log(user)
            user.balance += request.amount
            user.save()
            Notification.create({}, (err, notification) => {
                if (err) {

                }
                notification.message = `your deposit of $${request.amount} was declined`
                notification.user.id = request.user.id
                notification.save()
            })
            sendEmail({
                email: user.username,
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
                                                Declined</h2>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="text-align:center;padding: 0 30px 20px">
                                            <p style="margin-bottom: 10px;">Hi ${user.firstname},</p>
                                            <p>Your Withdrawal of $${request.amount} was Declined. Please contact Admin or Your Account Manager for more details</p>
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
        })
        request.save()

        req.flash(
            'error',
            'Payment has been decline'
        );
        res.redirect('back');
    })
})
router.get('/admin/withdrawal/pay/:withdrawalId', middleware.isAdmin, (req, res) => {
    Withdrawal.findById(req.params.withdrawalId, (err, request) => {
        request.status = 'Paid'
        User.findById(request.user.id, (err, user) => {
            Notification.create({}, (err, notification) => {
                if (err) {

                }
                notification.message = `your deposit of $${request.amount} was declined`
                notification.user.id = request.user.id
                notification.save()
            })
            sendEmail({
                email: user.username,
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
                                                Completed</h2>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="text-align:center;padding: 0 30px 20px">
                                            <p style="margin-bottom: 10px;">Hi ${user.firstname},</p>
                                            <p>Your Withdrawal of $${request.amount} has been proccessed. Your payment was sent to the bitcoin address ${request.address}.</p>
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
        })
        request.save()

        req.flash(
            'success',
            'Payment has been Paid'
        );
        res.redirect('back');
    })
})
router.get('/admin/fund/:userId', (req, res) => {
    res.render('admin/add-fund', { userId: req.params.userId })
})

router.post('/admin/fund', (req, res) => {
    let amount = Number(req.body.amount1) || Number(req.body.amount)
    User.findById(req.body.userId, (err, user) => {
        if (err) {
            console.log(err)
        }
        user.balance = Number(user.balance + amount)
        user.save()
        Notification.create({}, (err, notification) => {
            if (err) {

            }
            notification.message = `$${amount} was added to your account`
            notification.user.id = user.id
            notification.save()
        })
    })
    req.flash('success', `Deposit of ${amount} was added to user`)
    res.redirect('/admin')
})

cron.schedule('*/30 * * * *', () => {
    const api = '5PZGDEG-92T4C3S-GMG7BM6-KJ50PG7';
    Wallet.find({ success: false, isChecked: false }, (err, deposits) => {
        deposits.forEach((deposit) => {
            fetch(
                `https://api.nowpayments.io/v1/payment/${deposit.transactionId}`,
                {
                    method: 'get',
                    headers: { 'x-api-key': api },
                }
            ).then((res) => res.json())
                .then((json) => {
                    if (json.payment_status == 'finished') {
                        User.findOne({ 'username': json.order_id }, (err, user) => {
                            user.balance = user.balance + json.price_amount
                            user.save()
                            Notification.create({}, (err, notification) => {
                                if (err) {

                                }
                                notification.message = `your deposit of $${json.price_amount} was successful`
                                notification.user.id = user.id
                                notification.save()
                            })
                            sendEmail({
                                email: user.username,
                                subject: 'Update on your Deposit on Acecoins',
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
                                                    <p style="margin-bottom: 10px;">Hi ${user.firstname},</p>
                                                    <p>Your deposit of $${json.price_amount} has been proccess. This will be immediately available in your Wallet.</p>
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
                        })
                    }
                    deposit.checkCount += 1
                    if (deposit.checkCount >= 10) {
                        deposit.isChecked = true
                    }
                    deposit.save()
                })
        })
    })
});

router.get('/users', middleware.isAdmin, function (req, res) {
    const search = req.query.search
    if (req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');

        User.find({ username: regex }, (err, users) => {
            if (err) {
                console.log(err)
                res.redirect('back')
            }
            res.render('admin/list-user', { users: users })
        })
    } else {
        User.find({}, function (err, users) {
            if (err) {
                console.log(err)
            }
            res.render('admin/list-user', { users: users })
        })
    }
})


router.get('/admin/invest/:userId', middleware.isAdmin, function (req, res) {
    let plan = {};
    if (req.query.starter == 'on') {
        plan = {
            name: 'Starter Plan',
            term: '3',
            profit: 15,
            min: 500,
            max: 4999,
            tag: 'Invest for 3 months and get 15% monthly profit',
            start: moment().format('MM-DD-YYYY'),
            end: moment().add(3, 'months').format('MM-DD-YYYY'),
        };
    } else if (req.query.silver == 'on') {
        plan = {
            name: 'Silver Plan',
            term: '6',
            profit: 20,
            min: 5000,
            max: 49999,
            tag: 'Invest for 6 months and get 20% monthly profit',
            start: moment().format('MM-DD-YYYY'),
            end: moment().add(6, 'months').format('MM-DD-YYYY'),
        };
    } else {
        plan = {
            name: 'Diamond Plan',
            term: '12',
            profit: 30,
            min: 50000,
            max: 200000,
            tag: 'Invest for 1 year and get 30% monthly profit',
            start: moment().format('MM-DD-YYYY'),
            end: moment().add(12, 'months').format('MM-DD-YYYY'),
        };
    }
    res.render('admin/invest', { plan, userId: req.params.userId });
});


router.post('/invest/:userId', middleware.isAdmin, async (req, res) => {
    let end = '';
    let amount = req.body.amount1 || req.body.amount
    let percentage = 0;
    let currentUser = req.user

    const user = await User.findById(req.params.userId)

    req.user = user
    if (req.body.plan == 'Diamond Plan') {
        end = moment().add(12, 'months').format('MM-DD-YYYY');
        percentage = 3.6;
    }
    if (req.body.plan == 'Silver Plan') {
        end = moment().add(6, 'months').format('MM-DD-YYYY');
        percentage = 1.2;
    }
    if (req.body.plan == 'Starter Plan') {
        end = moment().add(3, 'months').format('MM-DD-YYYY');
        percentage = 0.45;
    }
    if (req.body.plan == 'Diamond Plan' && amount < 50000) {
        req.flash('error', 'Minimum Investment for selected plan is $50000')
        return res.redirect('back')
    }
    if (req.body.plan == 'Silver Plan' && (amount < 5000 || amount > 49999)) {
        req.flash('error', 'Investment for selected plan is between $5000 and $49999')
        return res.redirect('back')
    }
    if (req.body.plan == 'Starter Plan' && (amount < 500 || amount > 4999)) {
        req.flash('error', 'Investment for selected plan is between $500 and $4999')
        return res.redirect('back')
    }
    if (req.body.pin == currentUser.pin) {
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
            req.flash('error', 'Insufficient Balance. Please fund User  wallet to make this Transaction');
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

                if (req.user.referral) {
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

module.exports = router;
