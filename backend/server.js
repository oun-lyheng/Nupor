require('dotenv').config();

const express = require('express');
const app = express();
const morgan = require('morgan');
const port = 3000;

// ----- MIDDLEWARES -----
app.use(morgan('dev')); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

//  ---- FORMAT DATE ----
const date = new Date();
const formattedDate = date.toLocaleString("en-US", {
  timeZone: "Asia/Phnom_Penh",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});

app.get('/', (req, res) => {
   res.json({
    message: "Welcome to Nupor Backend!",
    date: formattedDate
   });
});

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        message: "Nupor Backend is good!",
        date: formattedDate
      });
});

const db = require("./src/models");

const testConnection = async () => {
  try {
    await db.sequelize.authenticate();
    console.log("Connected to database successfully!");
  } catch (error) {
    console.log("Failed to connect to database:", error);
  }
};

testConnection();

// ===============
// ----- ROUTES -----
// ===============

// AUTH ROUTES
const authRouter = require("./src/Features/Auth/Auth.routes");
app.use("/api/auth", authRouter);

// USER & PROFILE ROUTES
const userRouter = require("./src/Features/Users/User.routes");
app.use("/api", userRouter);

// CATEGORY ROUTES
const categoryRouter = require("./src/Features/categories/Category.routes")
app.use("/api" , categoryRouter)

// PRODUCT ROUTES 
const productRouter = require("./src/Features/products/Product.route") ;
app.use("/api" , productRouter);

// PRODUCT IMAGES ROUTES
const productImagesRouter = require("./src/Features/ProductsImages/ProductImages.routes");
app.use("/api", productImagesRouter);

// CART ROUTES
const cartRouter = require("./src/Features/Carts/Cart.routes");
app.use("/api", cartRouter);

// ORDER ROUTES
const orderRouter = require("./src/Features/Orders/Order.routes");
app.use("/api", orderRouter);

// REVIEW ROUTES
const reviewRouter = require("./src/Features/Reviews/Review.routes");
app.use("/api", reviewRouter);

// WISHLIST ROUTES
const wishlistRouter = require("./src/Features/Wishlists/Wishlist.routes");
app.use("/api", wishlistRouter);


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});