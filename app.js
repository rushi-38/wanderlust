if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();

const mongoose = require("mongoose");
const path = require("path");

const session = require("express-session");
const MongoStore = require("connect-mongo").default;

const flash = require("connect-flash");

const passport = require("passport");
const LocalStrategy = require("passport-local");

const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");

const ExpressError = require("./utils/ExpressError.js");

const User = require("./models/user.js");

const listings = require("./routes/listing.js");
const reviews = require("./routes/reviews.js");
const userRouter = require("./routes/user.js");

// ============================
// DATABASE URL
// ============================

const dbUrl = process.env.ATLASDB_URL;

console.log("DB URL:", dbUrl);

// ============================
// VIEW ENGINE SETUP
// ============================

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

app.engine("ejs", ejsMate);

// ============================
// MIDDLEWARES
// ============================

app.use(express.urlencoded({ extended: true }));

app.use(methodOverride("_method"));

app.use(express.static(path.join(__dirname, "/public")));

// ============================
// DATABASE CONNECTION
// ============================

async function main() {
  try {
    await mongoose.connect(dbUrl);

    console.log("Connected to MongoDB");
  } catch (err) {
    console.log("MongoDB Connection Error");
    console.log(err);
  }
}

main();

// ============================
// SESSION STORE
// ============================

const store = MongoStore.create({
  mongoUrl: dbUrl,

  crypto: {
    secret: process.env.SECRET,
  },

  touchAfter: 24 * 3600,
});

store.on("error", (err) => {
  console.log("SESSION STORE ERROR", err);
});

// ============================
// SESSION CONFIG
// ============================

const sessionOptions = {
  store,

  secret: process.env.SECRET,

  resave: false,

  saveUninitialized: false,

  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,

    maxAge: 7 * 24 * 60 * 60 * 1000,

    httpOnly: true,
  },
};

app.use(session(sessionOptions));

app.use(flash());

// ============================
// PASSPORT SETUP
// ============================

app.use(passport.initialize());

app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());

passport.deserializeUser(User.deserializeUser());

// ============================
// LOCALS MIDDLEWARE
// ============================

app.use((req, res, next) => {
  res.locals.success = req.flash("success");

  res.locals.error = req.flash("error");

  res.locals.currUser = req.user;

  next();
});

// ============================
// ROUTES
// ============================

app.use("/listings", listings);

app.use("/listings/:id/reviews", reviews);

app.use("/", userRouter);

// ============================
// 404 HANDLER
// ============================

app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

// ============================
// ERROR HANDLER
// ============================

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something Went Wrong" } = err;

  console.log(err);

  res.status(statusCode).render("listings/error.ejs", { message });
});

// ============================
// SERVER
// ============================

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});