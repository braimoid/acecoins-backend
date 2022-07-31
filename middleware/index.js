var middlewareObj = {};
middlewareObj.isLoggedIn = function (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  // req.flash("error", "Please login first");
  res.status(400).json({ message: "Please login first", error: true });
};
middlewareObj.isAdmin = function (req, res, next) {
  if (req.isAuthenticated()) {
    if (req.user.role == "admin") {
      return next();
    }
    res.status(400).json({ message: "Please login first", error: true });
  }
  // req.flash("error", "Please login first");
  // res.redirect("/login");
  res.status(400).json({ message: "Please login first", error: true });
};
middlewareObj.sessionChecker = (req, res, next) => {
  if (req.session.user && req.cookies.user_sid) {
    res.redirect("/dashboard");
  } else {
    next();
  }
};

module.exports = middlewareObj;
