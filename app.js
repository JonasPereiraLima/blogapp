// Carregando módulos
    const express = require('express');
    const handlebars = require('express-handlebars');
    const bodyParser = require('body-parser');
    const app = express();
    const admin = require('./routes/admin');
    const usuario = require('./routes/usuario');
    const path = require('path');
    const mongoose = require('mongoose');
    const session = require('express-session');
    const flash = require('connect-flash');
    require('./models/Postagem');
    const Postagem = mongoose.model('postagens');
    require('./models/Categoria');
    const Categoria = mongoose.model('categorias');
    const passport = require('passport');
    require('./config/auth')(passport)
    const db = require('./config/db');

// Configurações
    // Sessão
        app.use(session({
            secret: 'segurança-rigida',
            resave: true,
            saveUninitialized: true
        }));
        app.use(passport.initialize());
        app.use(passport.session())
        app.use(flash());
    // Midleware
        app.use((req, res, next) => {
            res.locals.success_msg = req.flash('success_msg');
            res.locals.error_msg = req.flash('error_msg');
            res.locals.error = req.flash('error');
            res.locals.user = req.user || null;
            next();
        })
    // Body-parser
        app.use(bodyParser.urlencoded({extended: true}));
        app.use(bodyParser.json());

    // Handlebars
        app.engine('handlebars', handlebars.engine({defaultLayout: 'main'}));//handlebars -> handlebars.engine
        app.set('view engine', 'handlebars');

    // Mongoose
        mongoose.Promise = global.Promise;
        mongoose.connect(db.mongoURI, {useNewUrlParser: true, useUnifiedTopology: true}).then(() => {console.log("conectado com sucesso!")}).catch((err) => {console.log("Erro ao tentar se conectar: "+ err)})
    // Public
        app.use(express.static(path.join(__dirname,'public')));
// Rotas
    app.get('/', (req, res) => {
        Postagem.find().lean().populate('categoria').sort({data: 'desc'}).then((postagens) =>{
            res.render('index', {postagens: postagens});
        }).catch((err) => {
            req.flash('error_msg', "Houve um erro interno");
            res.redirect('/404');
        })
        
    })

    app.get('/postagem/:slug', (req, res) => {
        Postagem.findOne({slug: req.params.slug}).lean().then((postagem) => {
            if(postagem){
                res.render('postagem/index', {postagem: postagem});
            }else{
                req.flash('error_msg', "Esta postagem não existe!");
                res.redirect('/');
            }
        }).catch((err) => {
            req.flash('error_msg', "Houve um erro ao exibir a postagem");
            res.redirect('/');
        })
    })

    app.get('/categorias', (req, res) => {
        Categoria.find().lean().then((categorias) => {
            res.render('categorias/index', {categorias: categorias});
        }).catch((err) => {
            req.flash('error_msg', "Houve um erro interno ao listar as categorias");
            res.redirect('/');
        })
    })

    app.get('/categoria/:slug', (req, res) => {
        Categoria.findOne({slug: req.params.slug}).lean().then((categoria) => {
            if(categoria){
                Postagem.find({categoria: categoria._id}).lean().then((postagens) => {
                    res.render('categorias/postagens', {postagens: postagens, categoria: categoria});
                }).catch((err) => {
                    req.flash('error_msg', "Houve um erro ao listar os posts!");
                    res.redirect('/');
                })
            }else{
                req.flash('error_msg', "Esta categoria não existe");
                res.redirect('/');
            }
        }).catch((err) => {
            req.flash('error_msg', "Houve um erro interno ao carregar a página desta categoria");
            res.redirect('/');
        })
    })
    
    app.get('/404', (req, res) => {
        res.send("Error 404");
    })

    app.get('/posts', (req, res) => {
        res.send('Página de posts');
    })

    app.use('/admin', admin);
    app.use('/usuario', usuario)
// Outros

const PORT = process.env.PORT || 9021;
app.listen(PORT, () => {
    console.log("Servidor rodando!");
})