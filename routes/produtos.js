const express = require('express');
const produtos = express.Router();
const Produto = require('../models/Produto');

produtos.route('/')
.get(async (req, res) => {
   try {
    const response = await Produto.find();
    res.status(200).json(response);
   } catch(err) {
    res.status(500).json(err);
   }
})

.post(async (req, res)=>{
    const {nome, descricao, qtde, preco, desconto, dataDesconto, categoria, img} = req.body;

    try{
    if(!nome || !descricao || !qtde || !preco || !categoria || !img) {
        return res.status(400).json({message: "Campos obrigatórios não preenchidos"});
    }
        if(desconto && dataDesconto) {
            const produto = new Produto ({nome, descricao, qtde, preco, desconto, dataDesconto, categoria, img});
            await produto.save();
            res.status(201).json(produto)
        } else {
            const produto = new Produto({nome, descricao, qtde, preco, categoria, img});
            await produto.save();
            res.status(201).json(produto)
        }
    } catch(err) {
        console.log(err);
        res.status(500).json({ message: "Um erro aconteceu." });
    }
})
.put(async (req, res) => {
    res.json({message: "rota put"})
})
.delete(async (req, res)=>{
    const { id } = req.body;
        try {
            const response = await Produto.findByIdAndRemove(id);
            if (!response) {
                return res.status(404).json({ mensagem: "Produto não encontrado" });
            }
            res.status(200).json(response);
        } catch (err) {
            res.status(500).json(err);
        }
});

module.exports = produtos;