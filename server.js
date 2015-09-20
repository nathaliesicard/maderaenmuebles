var koa = require('koa');
var logger = require('koa-logger');
var serve = require('koa-static');
var Router = require('koa-router');
var views = require('koa-views');

var nunjucks = require('nunjucks');


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
   '/productos': 'products',
   '/contacto': 'contact'
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