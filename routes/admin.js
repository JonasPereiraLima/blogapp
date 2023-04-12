const express = require('express');
const router = express.Router();
// para usar um model de forma externa no mongoose
const mongoose = require('mongoose');
require('../models/Categoria');
const Categoria = mongoose.model('categorias');
require('../models/Postagem');
const Postagem = mongoose.model('postagens');
const {eAdmin} = require('../helpers/eAdmin');

router.get('/', eAdmin, (req, res) => {
    res.render('admin/index');
})

router.get('/posts', eAdmin, (req, res) => {
    res.send("Página de posts");
})

router.get('/categorias', eAdmin, (req, res) => {
    Categoria.find().sort({date: 'desc'}).lean().then((categorias) => {
        res.render('admin/categorias', {categorias: categorias});
    }).catch((err) => {
        req.flash('error_msg', "Houve um erro ao listar as categorias");
        res.redirect('/admin');
    })
})

router.get('/categorias/add', eAdmin, (req, res) => {
    res.render('admin/addcategorias');
})

router.get('/categorias/edit/:id', eAdmin, (req, res) => {
    Categoria.findOne({_id:req.params.id}).lean().then((categoria) => {
        res.render('admin/editcategorias', {categoria:categoria});
    }).catch((err) => {
        req.flash('error_msg', "Esta categoria não existe");
    })
    
})

router.post('/categorias/nova', eAdmin, (req, res) => {
    
    var erros = [];

    if(!req.body.name || typeof req.body.name == undefined || req.body.name == null){
        erros.push({texto: "Nome inválido"})
    }

    if(!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null){
        erros.push({texto: "Slug inválido"});
    }

    if(req.body.name.length < 2){
        erros.push({texto: "Nome da categoria é muito pequeno"});
    }

    if(erros.length > 0){
        res.render('admin/addcategorias', {erros: erros})
    }else{
        const novaCategoria = ({
            nome: req.body.name,
            slug: req.body.slug
        })
    
        new Categoria(novaCategoria).save().then(() => {
            req.flash('success_msg', "Categoria criada com sucesso!");
            res.redirect('/admin/categorias');
        }).catch((err) => {
            req.flash('error_msg', "Houve um erro ao salvar a categoria, tente novamente!");
            console.log("Não foi possivel adicionar esta nova categoria: "+ err);
        })
    }
})

router.post('/categorias/edit', eAdmin, (req, res) => {

    var erros = [];

    if(!req.body.name || typeof req.body.name == undefined || req.body.name == null){
        erros.push({texto:"Nome inválido"});
    }

    if(!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null){
        erros.push({texto:"Slug inválido"});
    }

    if(req.body.name.length < 2){
        erros.push({texto:"Nome da categoria é muito pequeno"});
    }

    if(erros.length > 0){
        res.render('admin/editcategorias', {erros: erros});
    }else{
        Categoria.findOne({_id:req.body.id}).then((categoria) => {
            categoria.nome = req.body.name
            categoria.slug = req.body.slug

            categoria.save().then(() => {
                req.flash('success_msg', "Categoria editada com sucesso");
                res.redirect('/admin/categorias');
            }).catch((err) => {
                req.flash('error_msg', "Houve um erro ao tentar salvar a edição da categoria: "+err);
                res.redirect('/admin/categorias');
            })
        }).catch((err) => {
            req.flash('error_msg', "Houve um erro ao editar a categoria");
            res.redirect('/admin//categorias');
        })
    }
})

router.post('/categorias/deletar', eAdmin, (req, res) => {
    Categoria.deleteOne({_id:req.body.id}).then(() => {
        req.flash('success_msg', "Categoria removida");
        res.redirect('/admin/categorias');
    }).catch((err) => {
        req.flash('error_msg', "Houve um erro ao tentar remover a categoria");
        res.redirect('/admin/categorias');
    })
})

router.get('/postagens', eAdmin, (req, res) => {
    Postagem.find().populate('categoria').sort({data: 'desc'}).lean().then((postagens) => {
        res.render('admin/postagens', {postagens: postagens});
    }).catch((err) => {
        req.flash('error_msg', "Houve um erro ao listar as categorias");
    })
})

router.get('/postagens/add', eAdmin, (req, res) => {
    Categoria.find().lean().then((categoria) => {
        res.render('admin/addpostagens', {categoria: categoria});
    }).catch((err) => {
        req.flash('error_msg', "Houve um erro ao carregar o formulário");
        res.redirect('/admin');
    })
    
})

router.get('/postagens/edit/:id', eAdmin, (req, res) => {
    Postagem.findOne({_id: req.params.id}).lean().then((postagem) =>{
        Categoria.find().lean().then((categoria) => {
            res.render('admin/editpostagens', {postagem: postagem, categoria: categoria});
        }).catch((err) => {
            req.flash('error_msg', "Houve um erro ao listar as categorias");
            res.redirect('/admin/postagens');
        })
    }).catch((err) => {
        req.flash('error_msg', "Houve um erro ao carregar o formulário de edição");
        res.redirect('/admin/postagens');
    })
})

router.post('/postagens/nova', eAdmin, (req, res) => {
    var erros = []

    if(req.body.categoria == 0){
        erros.push({texto: "Nenhuma categoria registrada, por favor registre uma categoria"})
    }

    if(erros.length > 0){
        res.render('admin/addpostagens', {erros: erros});
    }else{
        const novaPostagem = {
            titulo: req.body.titulo,
            slug: req.body.slug,
            descricao: req.body.descricao,
            conteudo: req.body.conteudo,
            categoria: req.body.categoria
        }
    
        new Postagem(novaPostagem).save().then(() => {
            req.flash('success_msg', "Postagem criada com sucesso")
            res.redirect('/admin/postagens');
        }).catch((err) => {
            req.flash('error_msg', "Houve um erro ao tentar criar a postagem: "+err);
            res.redirect('/admin/postagens');
        })
    }
})

router.post('/postagens/edit', eAdmin, (req, res) => {
    Postagem.findOne({_id: req.body.id}).then((postagem) => {
        postagem.titulo = req.body.titulo
        postagem.slug = req.body.slug
        postagem.descricao = req.body.descricao
        postagem.conteudo = req.body.conteudo
        postagem.categoria = req.body.categoria

        postagem.save().then(() => {
            req.flash('success_msg', "Postagem editada com sucesso");
            res.redirect('/admin/postagens');
        }).catch((err) => {
            req.flash('error_msg', "Houve um erro ao salvar a edição");
            res.redirect('/admin/postagens');
        })

    })
})

router.post('/postagens/deletar', eAdmin, (req, res) => {
    Postagem.deleteOne({_id: req.body.id}).then(() => {
        req.flash('success_msg', "Postagem deletada");
        res.redirect('/admin/postagens');
    }).catch((err) => {
        req.flash('error_msg', "Houve um erro ao deletar a postagem");
        res.redirect('/admin/postagens');
    })
})

module.exports = router;