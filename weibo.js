var express = require('express');
var handlebars = require('express-handlebars').create({defaultLayout:'main',extname:'.hbs'});
var app = express();
require('body-parser');

app.engine('.hbs',handlebars.engine);
app.set('view engine','.hbs');

app.set('port',process.env.PORT || 3000);





//静态资源目录
app.use(express.static(__dirname+'/public'))

//路由
app.get('/',function(req,res) {
	res.render('home');
});

app.get('/about',function(req,res) {
	res.render('about')
});

var tours =[
			{id:0,name:'Hood River',price:99.99},
			{id:1,name:'Oregon Coast',price:149.95},
		];
		
app.get('/api/tours',function(req,res) {
	res.json(tours);
});




//定制404页面
app.use(function(req,res) {
	res.status(404);
	res.render('404');
});

//定制500页面
app.use(function(err,req,res,next) {
	console.error(err.stack);
	res.status(500);
	res.render('500');
});

app.listen(app.get('port'),function() {
	console.log('Express started on http://localhost:'+app.get('port')+'; press Ctrl-C to terminate.');
});