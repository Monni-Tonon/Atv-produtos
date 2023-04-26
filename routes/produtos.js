const express = require('express');
const produtos = express.Router();
const Produto = require('../models/Produto');
const Joi = require('joi');
const multer = require('multer');
const path = require('path');
const moment = require('moment');
const mime = require('mime-types');
const fs = require('fs');

const storage = multer.diskStorage({            // função que define o nome do arquivo a ser gravado localmente, bem como em qual pasta será gravado (/uploads).
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

.post(upload.array('img', 5), async (req, res)=>{           // aqui informamos que esperamos receber um array de no max 5 arquivos .
    
    const postSchema = Joi.object({                         // este schema define o tipo de cada dado presente na requisição para que façamos a validação
        
        nome: Joi.string().required(),
        descricao: Joi.string().required(),
        qtde: Joi.number().integer().required(),
        preco: Joi.number().positive().required(),
        desconto: Joi.number().min(0).max(1).optional(),
        dataDesconto: Joi.date().iso().optional(),
        categoria: Joi.string().required(),
        // img: Joi.string().valid('image/jpeg', 'image/jpg', 'image/png').optional()
    });

// ========================BLOCO TESTE======================================
//   // Verifica se a requisição contém arquivos
//   if (!req.files || req.files.length === 0) {
//     return res.status(400).json({ message: 'nenhuma imagem enviada' });
// }
// console.log(req.files)
// // Valida cada imagem enviada
// for (const file of req.files) {
//     console.log(file.mimetype);
//     const { error } = postSchema.validate({ img: file.mimetype, originalname: file.originalname });
//     if (error) {
//         return res.status(400).json({ message: 'imagem inválida' });
//     }
// }

// =========================BLOCO TESTE=====================================

    if (req.body.dataDesconto) {                        // função determina o formato esperado para a dataDesconto DD/MM/YYYY
        const momentDate = moment(req.body.dataDesconto, 'DD/MM/YYYY', true);
        if (!momentDate.isValid()) {                    // se não tiver no formato encerra o código e retorna erro ao usuário
            return res.status(400).json({ message: 'Data inválida. O formato esperado é DD/MM/YYYY.' });    
        }
        req.body.dataDesconto = momentDate.format('YYYY-MM-DD');    // se o formato for válido, converte para o formato da iso e reatribui o valor na requisição para então validar com o Joi
    }

    const { error } = postSchema.validate(req.body);    // usa a função validate do Joi, caso gere algum erro a variavel error será definida
    
    if (error) {                // se a variavel estiver definida, retornamos o erro ao usuário e encerramos o código.
        return res.status(400).json({ message: error.details[0].message });
    }

    // desestruturação dos campos da requisição para gravar o objeto a ser criado.
    const {nome, descricao, qtde, preco, desconto, dataDesconto, categoria} = req.body;

    try {
        //valida se o array de imagens está vazio
        if (req.files.length === 0) { // se array vazio encerra o a execução e retorna erro ao usuário
            return res.status(400).json({ message: "Ao menos uma imagem é obrigatória." })
        }

        for (const imagem of req.files) { // percorre cada arquivo enviado na requisição 
            if (!validaArquivo(imagem.originalname)) { // enviamos o arquivo para a função e ela verifica se é imagem ou não
                fs.unlink(imagem.path, () => {}); // se não for imagem esta linha remove o arquivo da pasta antes de finalizar o código com erro ao usuário.
                return res.status(400).json({ message: 'Arquivo inválido. Somente imagens .jpeg, .jpg e .png são permitidas.' });
            }
        }

        const img = req.files.map(file => file.path.replace(/\\/g, '/'));

        // verifica se o campo desconto e dataDesconto foram informados na requisição
            if (typeof desconto !== 'undefined' && typeof dataDesconto !== 'undefined') {       // se positivo gera o preco com desconto e grava o objeto com este campo.
                const precoComDesconto = preco - (preco * desconto);
                const produto = new Produto({ nome, descricao, qtde, preco, desconto, precoComDesconto, dataDesconto, categoria, img });
                await produto.save();
                res.status(201).json(produto);
            } else {            // se não for informado o desconto e dataDesconto, gravamos o objeto somente com o preco original e sem os dados de desconto.
                const produto = new Produto({ nome, descricao, qtde, preco, categoria, img });
                await produto.save();
                res.status(201).json(produto);
            }
        } catch (err) {         // se ocorrer algum erro no banco de dados retornamos o erro para o usuário.
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

    if (req.body.dataDesconto) {
        const momentDate = moment(req.body.dataDesconto, 'DD/MM/YYYY', true);
        if (!momentDate.isValid()) {
            return res.status(400).json({ message: 'Data inválida. O formato esperado é DD/MM/YYYY.' });
        }
        req.body.dataDesconto = momentDate.format('YYYY-MM-DD');
    }

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
            res.status(200).json(response);
            // res.status(200).json({message: "Produto alterado com sucesso.", produto: response}); => comentado por conta do retorno da documentacao
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
                return res.status(404).json({ message: "Produto não encontrado" });
            }
            res.status(200).json({message: "Produto deletado com sucesso.", produto: response});
        } catch (err) {
            res.status(500).json(err);
        }
});

function validaArquivo(nomeArquivo) { // função que verifica se o tipo de arquivo enviado é do tipo imagem
    const extensao = nomeArquivo.split('.').pop(); // faz o split para extrair a extensao do nome do arquivo
    const tipoMIME = mime.lookup(extensao); // usa a função do mime "lookup" para comparar a extensão

    return tipoMIME && tipoMIME.startsWith('image/');
}

module.exports = produtos;