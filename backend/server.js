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

// ----- ROUTES -----
const authRouter = require("./src/Features/Auth/Auth.routes");
app.use("/api/auth", authRouter);


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});