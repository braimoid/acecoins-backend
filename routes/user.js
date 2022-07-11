var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
const middleware = require("../middleware/index");
const short = require("short-uuid");
const { check, validationResult } = require("express-validator");
const sendEmail = require("../helpers/SendEmail");

router.get("/register", function (req, res) {
  // res.render("auth/register", { ref: req.query.ref }); // edited
  res.status(200).json({ ref: req.query.ref }); // edited
});
router.get("/register/:username", function (req, res) {
  // res.render("auth/register", { username: req.params.username });// edited
  res.status(200).json({ username: req.params.username }); // edited
});

router.post(
  "/register",
  [
    check("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    check("firstName").isString().trim().escape(),
    check("lastName").isString().trim().escape(),
    check("username").isEmail().withMessage("Enter a Valid Email"),
    check("pin")
      .isDecimal()
      .isLength({ min: 6, max: 6 })
      .withMessage("Pin must be six digit"),
  ],
  function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach((error) => {
        // req.flash("error", error.msg + "<br>"); //edited
        // return res.status(400).json({ message: error.msg, error: true }); // edited
      });
      // return res.redirect("/register"); // edited
    }
    User.register(
      new User({ username: req.body.username.toLowerCase() }),
      req.body.password,
      function (err, user) {
        if (err) {
          // req.flash("error", err.message); //edited
          // return res.redirect("back"); // edited
          return res.status(400).json({ message: err.message, error: true }); // edited
        }
        user.firstname = req.body.firstName;
        user.lastname = req.body.lastName;
        user.pin = req.body.pin;
        user.referralId = short.generate();
        user.referral = req.body.referral;
        user.verifyToken = short.generate();
        user.save();
        sendEmail({
          email: user.username,
          subject: "Comfirm Email",
          message: `<!DOCTYPE html>
          <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
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
                      -ms-interpolation-mode:bicubic;
                  }
              </style>
          
          </head> 
          
          <body width="100%" style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: #f5f6fa;">
            <center style="width: 100%; background-color: #f5f6fa;">
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f5f6fa">
                      <tr>
                         <td style="padding: 40px 0;">

                              <table style="width:100%;max-width:620px;margin:0 auto;background-color:#ffffff;">
                                  <tbody>
                                      <tr>
                                          <td style="padding: 30px 30px 15px 30px;">
                                              <h2 style="font-size: 18px; color: #6576ff; font-weight: 600; margin: 0;">Confirm Your E-Mail Address</h2>
                                          </td>
                                      </tr>
                                      <tr>
                                          <td style="padding: 0 30px 20px">
                                              <p style="margin-bottom: 10px;">Hi ${user.firstname},</p>
                                              <p style="margin-bottom: 10px;">Welcome! <br> You are receiving this email because you have registered on our site.</p>
                                              <p style="margin-bottom: 10px;">Click the link below to active your Acecoins account.</p>
                                              <p style="margin-bottom: 25px;">This link will expire in 3 days and can only be used once.</p>
                                              <a href="http://localhost:3000/confirm/${user.verifyToken}" style="background-color:#6576ff;border-radius:4px;color:#ffffff;display:inline-block;font-size:13px;font-weight:600;line-height:44px;text-align:center;text-decoration:none;text-transform: uppercase; padding: 0 30px">Verify Email</a>
                                          </td>
                                      </tr>
                                      <tr>
                                          <td style="padding: 20px 30px 40px">
                                              <p>If you did not make this request, please contact us or ignore this message.</p>
                                              <p style="margin: 0; font-size: 13px; line-height: 22px; color:#9ea8bb;">This is an automatically generated email please do not reply to this email. If you face any issues, please contact us at  help@icocrypto.com</p>
                                          </td>
                                      </tr>
                                  </tbody>
                              </table>
                              <table style="width:100%;max-width:620px;margin:0 auto;">
                                  <tbody>
                                      <tr>
                                          <td style="text-align: center; padding:25px 20px 0;">
                                              <p style="font-size: 13px;">Copyright © 2020 Acecoins. All rights reserved.
                                              <p style="padding-top: 15px; font-size: 12px;">This email was sent to you as a registered user of <a style="color: #6576ff; text-decoration:none;" href="https://acecoins.uk">acecoins.uk</a>.</p>
                                          </td>
                                      </tr>
                                  </tbody>
                              </table>
                         </td>
                      </tr>
                  </table>
              </center>
          </body>
          </html>
            `,
        });
        passport.authenticate("local")(req, res, function () {
          // req.flash(
          //     "success",
          //     "Welcome. Confirmation Email has been sent to your email. Please confirm to verify your account"
          // ); // edited
          // res.redirect("/dashboard"); // edited
          res.status(200).json({
            message:
              "Confirmation Email has been sent to your email. Please confirm to verify your account",
          }); // edited
        });
      }
    );
  }
);

router.get("/login", function (req, res) {
  // res.render("auth/login", { message: req.flash("error") }); // edited
  res
    .status(401)
    .json({ message: "Invalid Username or Password", error: true }); // edited
});

router.get("/loginsuccess", function (req, res) {
  // res.render("auth/login", { message: req.flash("error") }); // edited
  res.status(200).json({ message: "Login Success", success: true }); // edited
});

router.post(
  "/login",
  (req, res, next) => {
    // console.log(req.body.username)
    req.body.username = req.body.username.toLowerCase();
    next();
    // res.send(req.body.username)
  },
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
    failureFlash: "Invalid Username or Password",
    successFlash: "Welcome back",
  }),
  function (req, res) {}
);

router.get("/forget", (req, res) => {
  // res.render("auth/forget", { message: req.flash("error") }); edited
  res.status(400).json({ message: "Forget Password" });
});
router.post("/forget", async function (req, res) {
  User.findOne({ username: req.body.email.toLowerCase() }, (err, user) => {
    if (err || user === null) {
      // req.flash("error", "user not found please enter correct email"); // edited
      // return res.redirect("back"); // edited
      return res
        .status(400)
        .json({
          message: "User not found please enter correct email",
          error: true,
        }); // edited
    }
    user.resetToken = short.generate();
    user.resetTokenExpiry = Date.now() + 3000000;
    user.save();

    sendEmail({
      email: user.username,
      subject: "Password Reset",
      message: `<!DOCTYPE html>
      <html
        lang="en"
        xmlns="http://www.w3.org/1999/xhtml"
        xmlns:v="urn:schemas-microsoft-com:vml"
        xmlns:o="urn:schemas-microsoft-com:office:office"
      >
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width" />
          <meta http-equiv="X-UA-Compatible" content="IE=edge" />
          <meta name="x-apple-disable-message-reformatting" />
          <title></title>
      
          <link
            href="https://fonts.googleapis.com/css?family=Roboto:400,600"
            rel="stylesheet"
            type="text/css"
          />
          <!-- Web Font / @font-face : BEGIN -->
          <!--[if mso]>
            <style>
              * {
                font-family: 'Roboto', sans-serif !important;
              }
            </style>
          <![endif]-->
      
          <!--[if !mso]>
            <link
              href="https://fonts.googleapis.com/css?family=Roboto:400,600"
              rel="stylesheet"
              type="text/css"
            />
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
      
        <body
          width="100%"
          style="
            margin: 0;
            padding: 0 !important;
            mso-line-height-rule: exactly;
            background-color: #f5f6fa;
          "
        >
          <center style="width: 100%; background-color: #f5f6fa">
            <table
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              bgcolor="#f5f6fa"
            >
              <tr>
                <td style="padding: 40px 0">
                  <table style="width: 100%; max-width: 620px; margin: 0 auto">
                    <tbody>
                    </tbody>
                  </table>
                  <table
                    style="
                      width: 100%;
                      max-width: 620px;
                      margin: 0 auto;
                      background-color: #ffffff;
                    "
                  >
                    <tbody>
                      <tr>
                        <td style="text-align: center; padding: 30px 30px 15px 30px">
                          <h2
                            style="
                              font-size: 18px;
                              color: #6576ff;
                              font-weight: 600;
                              margin: 0;
                            "
                          >
                            Reset Password
                          </h2>
                        </td>
                      </tr>
                      <tr>
                        <td style="text-align: center; padding: 0 30px 20px">
                          <p style="margin-bottom: 10px">Hi ${user.lastname},</p>
                          <p style="margin-bottom: 25px">
                            Click On The link blow to reset tour password. Link expires in 5 mins
                          </p>
                          <a
                            href="http://localhost:3000/reset/${user.resetToken}"
                            style="
                              background-color: #6576ff;
                              border-radius: 4px;
                              color: #ffffff;
                              display: inline-block;
                              font-size: 13px;
                              font-weight: 600;
                              line-height: 44px;
                              text-align: center;
                              text-decoration: none;
                              text-transform: uppercase;
                              padding: 0 25px;
                            "
                            >Reset Password</a
                          >
                        </td>
                      </tr>
                      <tr>
                        <td style="text-align: center; padding: 20px 30px 40px">
                          <p>
                            If you did not make this request, please contact us or
                            ignore this message.
                          </p>
                          <p
                            style="
                              margin: 0;
                              font-size: 13px;
                              line-height: 22px;
                              color: #9ea8bb;
                            "
                          >
                            This is an automatically generated email please do not
                            reply to this email. If you face any issues, please
                            contact us at admin@acecoins.uk
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <table style="width: 100%; max-width: 620px; margin: 0 auto">
                    <tbody>
                      <tr>
                        <td style="text-align: center; padding: 25px 20px 0">
                          <p style="font-size: 13px">
                            Copyright © 2020 Acecoins. All rights reserved. <br />
                          </p>
                          <p style="padding-top: 15px; font-size: 12px">
                            This email was sent to you as a registered user of
                            <a
                              style="color: #6576ff; text-decoration: none"
                              href="https://acecoins.uk"
                              >acecoins.uk</a
                            >
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </table>
          </center>
        </body>
      </html>
      `,
    });

    // res.render("auth/resetSubmit", { email: user.username }); // edited
    res.status(200).json({ email: user.username }); // edited
  });
});

router.get("/reset/:resettoken", (req, res) => {
  // res.render( "auth/resetPassword", { token: req.params.resettoken } ); // edited
  res.status(200).json({ token: req.params.resettoken }); // edited
});

router.post(
  "/resetPassword/:token",
  [
    check("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  (req, res) => {
    User.findOne({ resetToken: req.params.token }, (err, user) => {
      if (err) {
        res.status(400).json({ message: err.message, error: true });
        return console.log(err);
      }

      if (Date.now() > user.resetTokenExpiry) {
        // req.flash("error", "Token  have expired"); // edited
        // return res.redirect("/login"); // edited
        return res
          .status(400)
          .json({ message: "Token have expired", error: true }); // edited
      }
      user.setPassword(req.body.password, (err, user) => {
        if (err) {
          console.log(err);
          res.status(400).json({ message: err.message, error: true });
        }
        user.save();
      });
      user.save();
      // res.redirect("/login"); // edited
      res
        .status(200)
        .json({ message: "Password reset successfully", success: true }); // edited
    });
  }
);
router.get("/logout", (request, response) => {
  request.logout();
  response
    .status(200)
    .json({ message: "Logged out successfully", success: true });
});

router.get("/confirm/:verifyToken", (req, res) => {
  User.findOne({ verifyToken: req.params.verifyToken }, (err, user) => {
    if (err) {
      console.log(err);
      // req.flash("error", "Token does not exit or have expired");
      // res.redirect("/login");
      res
        .status(400)
        .json({ error: true, message: "Token does not exit or have expired" });
    }
    user.userStatus = "Verified";
    user.save();
    console.log(user);
    // req.flash("success", "User has been successfully verified"); // edited
    // res.redirect("/dashboard"); // edited
    res
      .status(200)
      .json({ message: "User has been successfully verified", success: true });
  });
});

router.get("/payments/success", middleware.isLoggedIn, (request, response) => {
  // request.flash("success", "Payment Successfull"); // edited
  // response.redirect("/dashboard"); // edited
  response.status(200).json({ message: "Payment Successfull", success: true });
});

module.exports = router;
