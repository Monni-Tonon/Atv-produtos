const express = require('express');
const produtos = express.Router();
const Produto = require('../models/Produto');
const Joi = require('joi');
const multer = require('multer');
const path = require('path');
const moment = require('moment');
const mime = require('mime-types');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({ storage });

produtos.route('/')
.get(async (req, res) => {
    const { nome, preco, categoria } = req.query;
    try {
        if (!nome && !preco && !categoria) {
            const response = await Produto.find();
            res.status(200).json(response);
        } else {
            const query = {};
            if (nome) {
                query.nome = { $regex: nome, $options: 'i' };
            }
            if (preco) {
                query.preco = { $gte: preco };
            }
            if (categoria) {
                query.categoria = categoria;
            }
            const response = await Produto.find().or([query]);
            res.status(200).json(response)
        }
    } catch (err) {
        res.status(500).json(err);
    }
})

.post(upload.array('img', 5), async (req, res)=>{
    
    const postSchema = Joi.object({
        
        nome: Joi.string().required(),
        descricao: Joi.string().required(),
        qtde: Joi.number().integer().required(),
        preco: Joi.number().positive().required(),
        desconto: Joi.number().min(0).max(1).optional(),
        dataDesconto: Joi.date().iso().optional(),
        categoria: Joi.string().required(),
        img: Joi.string().valid('image/jpeg', 'image/jpg', 'image/png').optional()
    });

// ========================BLOCO TESTE======================================
  // Verifica se a requisição contém arquivos
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'nenhuma imagem enviada' });
}
console.log(req.files)
// Valida cada imagem enviada
for (const file of req.files) {
    console.log(file.mimetype);
    const { error } = postSchema.validate({ img: file.mimetype, originalname: file.originalname });
    if (error) {
        return res.status(400).json({ message: 'imagem inválida' });
    }
}

// =========================BLOCO TESTE=====================================

    if (req.body.dataDesconto) {
        const momentDate = moment(req.body.dataDesconto, 'DD/MM/YYYY', true);
        if (!momentDate.isValid()) {
            return res.status(400).json({ message: 'Data inválida. O formato esperado é DD/MM/YYYY.' });
        }
        req.body.dataDesconto = momentDate.format('YYYY-MM-DD');
    }

    const { error } = postSchema.validate(req.body);
    
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    const {nome, descricao, qtde, preco, desconto, dataDesconto, categoria} = req.body;

    try {

        const img = req.files.map(file => file.path.replace(/\\/g, '/'));
            if(img.length === 0) {
                return res.status(400).json({mensagem: "Ao menos uma imagem é obrigatória."})
            }

        if (typeof desconto !== 'undefined' && typeof dataDesconto !== 'undefined') {
            const precoComDesconto = preco - (preco * desconto);
            const produto = new Produto({ nome, descricao, qtde, preco, desconto, precoComDesconto, dataDesconto, categoria, img });
            await produto.save();
            res.status(201).json({message: "produto criado com sucesso.", produto: produto});
        } else {
            const produto = new Produto({ nome, descricao, qtde, preco, categoria, img });
            await produto.save();
            res.status(201).json({message: "produto cadastrado com sucesso.", produto: produto});
        }
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
})
.put(async (req, res) => {

    const putSchema = Joi.object({
        id: Joi.string().required(),
        nome: Joi.string().required(),
        descricao: Joi.string().required(),
        qtde: Joi.number().integer().required(),
        preco: Joi.number().positive().required(),
        desconto: Joi.number().min(0).max(1).optional(),
        dataDesconto: Joi.date().iso().optional(),
        categoria: Joi.string().required(),
        img: Joi.string().required()
    });

    const { error } = putSchema.validate(req.body);

    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const { id, nome, descricao, qtde, preco, desconto, dataDesconto, categoria, img } = req.body;

    try {

        const produtoEncontrado = await Produto.findById(id);
        if (!produtoEncontrado) {
            return res.status(404).json({ message: "produto não encontrado!" });
        }

        if (typeof desconto !== 'undefined' && typeof dataDesconto !== 'undefined') {
            const precoComDesconto = preco - (preco * desconto);
            const response = await Produto.findByIdAndUpdate(id, { nome, descricao, qtde, preco, desconto, dataDesconto, precoComDesconto, categoria, img }, { new: true })
            res.status(200).json(response);
        } else {
            const response = await Produto.findByIdAndUpdate(id, { nome, descricao, qtde, preco, categoria, img }, { new: true })
            res.status(200).json({message: "Produto alterado com sucesso.", produto: response});
        }

    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
})
.delete(async (req, res)=>{
    const deleteSchema = Joi.object({ id: Joi.string().required()});

    const { error } = deleteSchema.validate(req.body);

        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }
    const { id } = req.body;
        try {
            const response = await Produto.findByIdAndRemove(id);
            if (!response) {
                return res.status(404).json({ mensagem: "Produto não encontrado" });
            }
            res.status(200).json({message: "Produto deletado com sucesso.", produto: response});
        } catch (err) {
            res.status(500).json(err);
        }
});

module.exports = produtos;