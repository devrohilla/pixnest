var express = require('express');
var router = express.Router();
const userModel = require("./users");
const postModel = require("./posts");
const passport = require('passport');
const upload = require("./multer");

const localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()));

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/viewprofile/:id/:myid',async (req,res)=>{ 
  let user=await userModel.findOne({_id:req.params.id}).populate('posts')
  let loggedinuser=await userModel.findById({_id:req.params.myid})
  res.render('viewprofile',{user,loggedinuser})
})

router.get("/login", function (req, res, next) {
  res.render('login', { error: req.flash('error') });
})
router.get("/feed", function (req, res, next) {
  res.render('feed');
})

//const upload = require('./multerSetup');

router.post('/upload', isLoggedIn, upload.single('file'), async function (req, res, next) {
  if (!req.file) {
    return res.status(404).send("no files were given");
  }
  const user = await userModel.findOne({ username: req.session.passport.user });
  const post = await postModel.create({
    image: req.file.filename,
    imageText: req.body.filecaption,
    user: user._id
  });

  user.posts.push(post._id);
  await user.save()
  res.redirect("/profile");

})

router.get("/home/:id", async (req, res) => {
  let posts = await postModel.find({}).populate("user")
  let loggedinuser = await userModel.findById(req.params.id);
  res.render('home', { posts ,loggedinuser})
})

router.get("/profile", isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({
    username: req.session.passport.user
  })
    .populate("posts")
  res.render("profile", { user });
})

router.get("/edit", isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({
    username: req.session.passport.user
  }).populate("posts");

  res.render("edit", { user, error: null });
});

router.post('/update/:id', upload.single('image'), async (req, res) => {
  try {
    let { username, fullname, description } = req.body;

    // Check duplicate username (except current user)
    const existingUser = await userModel.findOne({ username: username });
    if (existingUser && existingUser._id.toString() !== req.params.id) {
      const user = await userModel.findById(req.params.id); // 👈 user bhi bhejna padega
      return res.render("edit", { user, error: "Username already exists" });
    }

    // Update user
    let user = await userModel.findByIdAndUpdate(
      req.params.id,
      { username, fullname, description },
      { new: true }
    );

    // Agar nayi image upload ki gayi ho
    if (req.file) {
      user.image = req.file.filename;
      await user.save();
    }

    res.redirect('/profile');

  } catch (err) {
    console.log(err);
    const user = await userModel.findById(req.params.id);
    res.render("edit", { user, error: "Something went wrong" });
  }
});

router.post('/delete/:id', async (req, res) => {
  let post = await postModel.findOneAndDelete(
    { _id: req.params.id }    // filter
  )
  res.redirect('/profile')
})

router.post('/remove/:id', async (req, res) => {
  let user = await userModel.findOneAndUpdate(
    { _id: req.params.id },    // filter
    { image: "default.png" },
    { new: true }
  )
  res.redirect('/edit')
})


router.post("/register", async function (req, res) {
  try {
    const { username, email, fullname, password } = req.body;

    // Check if username or email already exists
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


router.post("/login", passport.authenticate("local", {
  successRedirect: "/profile",
  failureRedirect: "/login",
  failureFlash: true
}), function (req, res) {
})

router.get('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

router.get("/guest",async (req,res)=>{
    let posts = await postModel.find({}).populate("user")

  res.render("guest",{posts})
})

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}

module.exports = router;
