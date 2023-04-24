require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const produtos = require("./routes/produtos");
const app = express();

app.use(express.json());
mongoose.connect(process.env.MONGODB_URL)

// chamar rotas
app.use("/produtos", produtos);

app.listen(3000, () => {
    console.log("Aplicação rodando em http://localhost:3000")
})