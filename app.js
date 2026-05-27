if (process.env.NODE_ENV != "production") {

  require('dotenv').config();
}



const express = require("express");
const app = express();
const mongoose = require("mongoose");
const router = express.Router({ mergeParams: true });
const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const path = require("path");
const session = require("express-session");
const MongoStore = require('connect-mongo').default;
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
// const dbUrl=process.env.ATLASDB_URL;

const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");

const { listingSchema, reviewSchema } = require("./schema.js");

const listings = require("./routes/listing.js");

const reviews = require("./routes/reviews.js");
const userRouter = require("./routes/user.js");

const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const review = require("./models/review.js");


// --------------------
// view engine setup
// --------------------

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);


// --------------------
// middlewares
// --------------------

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));



// --------------------
// database connection
// --------------------

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}


// --------------------
// root
// --------------------
// app.get("/", (req, res) => {
//   console.log("root");
//   res.send("root");
// });



const store = MongoStore.create({
  mongoUrl: MONGO_URL,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600,
});


store.on("error",(err)=>{
  console.log("ERROR in MONGO SESSIOS STORE",err);
});

const sessionoptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true
};





app.use(session(sessionoptions));
app.use(flash());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});


//demo User
// app.get("/demouser", async (req, res) => {
//   let fakeUser = new User({
//     email: "studenet@gmail.com",
//     username: "delta-student"
//   });
//   let registeredUser = await User.register(fakeUser, "helloworld");
//   res.send(registeredUser);
// });



// --------------------
// listings routes
// --------------------

app.use("/listings", listings);

app.use("/listings/:id/reviews", reviews);

app.use("/", userRouter);



// --------------------
// middleware
// --------------------

app.use((req, res, next) => {
  next(new ExpressError(404, "page not found!"));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong" } = err;
  console.log(err);
  res.status(statusCode).render("listings/error.ejs", { message });
});


// --------------------
// server
// --------------------

app.listen(8080, () => {
  console.log("server running");
  console.log("DB URL:", process.env.ATLASDB_URL);
});