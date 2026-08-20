const cloudinary = require("../config/cloudinary");

function uploadBufferImageToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buffer);
  });
}

module.exports = {
    uploadBufferImageToCloudinary
}
