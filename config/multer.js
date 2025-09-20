const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary"); // config/cloudinary.js banaya tha

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "pixnest_uploads", // cloudinary me folder ka naam
    allowed_formats: ["jpg", "png", "jpeg"]
  },
});

const upload = multer({ storage });

module.exports = upload;
