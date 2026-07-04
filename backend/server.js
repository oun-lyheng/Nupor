require('dotenv').config();

const express = require('express');
const app = express()
const port = 3000

app.get('/', (req, res) => {
   res.json({
    messsage : "Welcome to Nupor Backend!"
   })
})

app.get("/health" , (req , res) => {
    res.json({
        status : "ok" ,
        messsage : "Nupor Backend is good!"})
})

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


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})