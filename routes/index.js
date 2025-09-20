var express = require('express');
var router = express.Router();
const userModel = require("../models/user"); // ../ kyunki routes folder ke liye
const postModel = require("../models/post");
const passport = require('passport');
const upload = require("../config/multer");      // multer.js setup
const cloudinary = require('cloudinary').v2;

const localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()));

/* GET home page */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

// 🔹 View profile
router.get('/viewprofile/:id/:myid', async (req, res) => {
  let user = await userModel.findOne({ _id: req.params.id }).populate('posts');
  let loggedinuser = await userModel.findById({ _id: req.params.myid });
  res.render('viewprofile', { user, loggedinuser });
});

// 🔹 Login page
router.get("/login", function (req, res) {
  res.render('login', { error: req.flash('error') });
});

// 🔹 Feed page
router.get("/feed", function (req, res) {
  res.render('feed');
});

// 🔹 Upload post
router.post('/upload', isLoggedIn, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(404).send("No file was uploaded");

    // Find logged-in user
    const user = await userModel.findOne({ username: req.session.passport.user });
    if (!user) return res.status(401).send("User not found");

    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'your-folder-name', // optional: organize uploads in a folder
    });

    // Save post with Cloudinary URL
    const post = await postModel.create({
      image: result.secure_url,   // ✅ Cloudinary URL
      imageText: req.body.filecaption,
      user: user._id
    });

    res.status(201).json(post);
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).send("Internal Server Error");
  }
});


// 🔹 Home page with posts
router.get("/home/:id", async (req, res) => {
  let posts = await postModel.find({}).populate("user");
  let loggedinuser = await userModel.findById(req.params.id);
  res.render('home', { posts, loggedinuser });
});

// 🔹 Profile page
router.get("/profile", isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({
    username: req.session.passport.user
  }).populate("posts");

  res.render("profile", { user });
});

// 🔹 Edit profile page
router.get("/edit", isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({
    username: req.session.passport.user
  }).populate("posts");

  res.render("edit", { user, error: null });
});

// 🔹 Update profile
router.post('/update/:id', upload.single('image'), async (req, res) => {
  try {
    let { username, fullname, description } = req.body;

    // Check duplicate username
    const existingUser = await userModel.findOne({ username: username });
    if (existingUser && existingUser._id.toString() !== req.params.id) {
      const user = await userModel.findById(req.params.id);
      return res.render("edit", { user, error: "Username already exists" });
    }

    // Update user
    let user = await userModel.findByIdAndUpdate(
      req.params.id,
      { username, fullname, description },
      { new: true }
    );

    if (req.file) {
      user.image = req.file.path;
      await user.save();
    }

    res.redirect('/profile');
  } catch (err) {
    console.log(err);
    const user = await userModel.findById(req.params.id);
    res.render("edit", { user, error: "Something went wrong" });
  }
});

// 🔹 Delete post
router.post('/delete/:id', async (req, res) => {
  await postModel.findOneAndDelete({ _id: req.params.id });
  res.redirect('/profile');
});

// 🔹 Remove DP
router.get('/remove/:id', async (req, res) => {
  await userModel.findOneAndUpdate(
    { _id: req.params.id },
    { image: "default.png" },
    { new: true }
  );
  res.redirect('/edit');
});

// 🔹 Register
router.post("/register", async function (req, res) {
  try {
    const { username, email, fullname, password } = req.body;

    const existingUser = await userModel.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.render("index", { 
        title: "Register",
        error: "Username or Email already exists!" 
      });
    }

    const userData = new userModel({ username, email, fullname });
    await userModel.register(userData, password);

    passport.authenticate("local")(req, res, function () {
      res.redirect("/profile");
    });
  } catch (err) {
    console.log(err);
    res.render("index", { 
      title: "Register",
      error: "Something went wrong, please try again." 
    });
  }
});

// 🔹 Login POST
router.post("/login", passport.authenticate("local", {
  successRedirect: "/profile",
  failureRedirect: "/login",
  failureFlash: true
}));

// 🔹 Logout
router.get('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

// 🔹 Guest view
router.get("/guest", async (req, res) => {
  let posts = await postModel.find({}).populate("user");
  res.render("guest", { posts });
});

// Middleware
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}

module.exports = router;
