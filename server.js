var koa = require('koa');
var logger = require('koa-logger');
var serve = require('koa-static');
var Router = require('koa-router');
var views = require('koa-views');
var bodyParser = require('koa-bodyparser');

var nunjucks = require('nunjucks');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

var app = koa();

app.use(logger());
app.use(serve('public'));

app.use(views('views', {
    map: {
        html: 'nunjucks'
    }
}));



var router = new Router();

var paths = {
   '/': 'index',
   '/cocinas': 'cocinas',
   '/pergolas': 'pergolas',
   '/closets': 'closets',
   '/muebles': 'muebles',
   '/nosotros': 'nosotros',
   '/contacto': 'contacto'
   '/enviado': 'enviado'
};

Object.keys(paths).forEach(function(path) {
    router.get(path, function*() {
        yield this.render(paths[path]);
    });
});

app.use(router.routes());


app.use(function*() {

    this.status = 404;
    this.body = 'Page not found';

});


var port = process.env.PORT || 2500;


app.listen(port, function() {
    console.log('Great success! Listening on port ', port);
});


var transporter = nodemailer.createTransport(smtpTransport({
    port: 587,
    host: 'smtp.mandrillapp.com',
    auth: {
        user: 'contacto@maderaenmuebles.com',
        pass: process.env.NODEMAILER_PASSWORD
    }
}));



function sendEmail(text) {
    return new Promise(function(resolve, reject) {
        transporter.sendMail({
            from: 'contacto@maderaenmuebles.com', // sender address
            to: 'contacto@maderaenmuebles.com', // list of receivers
            subject: 'Contacto Madera en Muebles SG',
            text: text
        }, function (error, info) {
            if (error) {
                console.error('Got send mail error: ', error);
                reject(error);
            } else {
                console.log('Message sent: ', info.response);
                resolve();
            }
        });
    });
}

router.post('/contacto', bodyParser(), function*() {
    console.log('Contact us form was run!', this.request.body);

    yield sendEmail('A contact us was submitted with: ' + JSON.stringify(this.request.body));

    this.redirect('/enviado');
});
