// PARA CHECAR A DOCUMENTAÇÃO ACESSE: http://localhost:3000/api-docs/#/
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json')

const produtos = require("./routes/produtos");
const app = express();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.json());

mongoose.connect(process.env.MONGODB_URL)

// chamar rotas
app.use("/produtos", produtos);
app.use(express.static('uploads'));

// rota de retorno da img no navegador
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
    res.sendFile(`${__dirname}/uploads/${filename}`);
});


app.listen(3000, () => {
    console.log("Aplicação rodando em http://localhost:3000");
})