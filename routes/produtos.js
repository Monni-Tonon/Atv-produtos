const express = require('express');
const produtos = express.Router();

produtos.route('/')
.get(async (req, res) => {
    res.json({message: "rota get"})
})
.post(async (req, res)=>{
    res.json({mensagem: 'rota post'})
})
.put(async (req, res) => {
    res.json({message: "rota put"})
})
.delete(async (req, res)=>{
    res.json({mensagem: 'rota delete'})
});

module.exports = produtos;