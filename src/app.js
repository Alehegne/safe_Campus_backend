const express = require("express");

const app = express();

app.get("/", (req, res) => {
  console.log("welcome to safecampus");
});

module.exports = app;
