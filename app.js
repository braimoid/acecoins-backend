const bodyParser = require("body-parser");
var express = require("express");
const flash = require("connect-flash-plus");
const mongoose = require("mongoose");
const passport = require("passport");
const User = require("./models/user");
const Notification = require("./models/notification");
const localStrategy = require("passport-local");
const methodOverride = require("method-override");
const app = express();
var cors = require("cors");
const cron = require("node-cron");
const authRoutes = require("./routes/user");
const userRoutes = require("./routes/index");
const adminRoutes = require("./routes/admin");
const academyRoutes = require("./routes/academy");
const dotenv = require("dotenv");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const mongoSanitize = require("express-mongo-sanitize");
const { addinterest, matureinvestment } = require("./transactions");

dotenv.config({});
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://acecoins.netlify.app",
      "https://acecoins.uk",
      "https://acecoins.onrender.com",
    ],
    credentials: true,
  })
);

mongoose.connect(
  "mongodb+srv://admin:madman2000@cluster0-xlo6v.mongodb.net/acess?retryWrites=true",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  }
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride("_method"));

app.use(mongoSanitize());
// app.use(cookieParser());
app.enable("trust proxy");
app.use(
  session({
    secret: "Best friend",
    resave: false,
    proxy: true,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
    saveUninitialized: true,
    cookie: { secure: true, sameSite: "none" },
  })
);

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(async function (req, res, next) {
  res.locals.currentUser = req.user;
  if (req.user) {
    res.locals.notifications = await Notification.find({
      "user.id": req.user.id,
    }).sort("-1");
  }

  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

app.use(authRoutes);
app.use(userRoutes);
app.use(adminRoutes);
app.use("/academy", academyRoutes);

//runs when server restart
//addinterest()

cron.schedule(
  "0 0 * * *",
  () => {
    addinterest();
  },
  {
    scheduled: true,
    timezone: "Europe/Berlin",
  }
);

cron.schedule(
  "0 1 * * *",
  () => {
    matureinvestment();
  },
  {
    scheduled: true,
    timezone: "Europe/Berlin",
  }
);

const getUser = async () => {
  const users = await User.findOne({ username: "jdfxtd@gmail.com" })
    .then((data) => console.log(data))
    .catch((error) => console.log(error));
};

// getUser();

app.get("*", function (req, res) {
  res.status(404);
});
app.listen(process.env.PORT || 8080, process.env.IP, function () {
  console.log("Server Has Started!");
});
