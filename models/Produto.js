const { model, Schema } = require("mongoose");

const Produto = model (
    "produto",
    new Schema({
        nome: {
            type: String,
            required: true,
        },
        descricao: {
            type: String,
            required: true,
        },
        qtde: {
            type: Number,
            required: true,
        },
        preco: {
            type: Number,
            required: true,
        },
        desconto: {
            type: Number,
        },
        dataDesconto: {
            type: Date,
        },
        precoComDesc: {
            type: Number,
        },
        categoria: {
            type: String,
            required: true,
        },
        img: {
            type: [String],
            required: true,
        }
    })
)

module.exports = Produto;

