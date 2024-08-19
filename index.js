const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bodyparser = require("body-parser");
const ejs = require("ejs");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const User = require("./models/User.js");
const bcrypt = require("bcryptjs");

const PORT = process.env.PORT || 8000;
const app = express();
dotenv.config();
app.use(bodyparser.json());

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(process.env.mongo_url)
  .then(() => {
    console.log("database is connected....");
  })
  .catch((err) => {
    console.log("there is error", err);
  });

const store = new MongoDBStore({
  uri: process.env.mongo_url,
  collection: "mysession",
});
app.use(
  session({
    secret: "this is my key",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

const checkAuth = (req, res, next) => {
  if (req.session.isAuthenticated) {
    next();
  } else {
    res.redirect("/signup");
  }
};

app.get("/signup", (req, res) => {
  res.render("register");
});
app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/dashboard", checkAuth, (req, res) => {
  res.render("welcome");
});

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  let user = await User.findOne({ email });
  if (user) {
    return res.redirect("/signup");
  }
  const hanshedPassword = await bcrypt.hash(password, 12);
  user = new User({
    username,
    email,
    password: hanshedPassword,
  });
  req.session.person = user.username;
  await user.save();
  res.redirect("/login");
});

app.post("/user-login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.redirect("/signup");
  }
  const checkpass = await bcrypt.compare(password, user.password);
  if (!checkpass) {
    return res.redirect("/signup");
  }
  req.session.isAuthenticated = true;
  res.redirect("/dashboard");
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect("/login");
  });
});
app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
