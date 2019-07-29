var http = require('http');
var express = require('express');
var handlebars = require('express-handlebars').create({defaultLayout:'main',extname:'.hbs'});
var app = express();
var credentials = require('./credentials.js');
var morgan = require('morgan');
var mongoose = require('mongoose');
var opts = {useNewUrlParser:true};
var Vacation = require('./models/vacation.js');

//连接数据库
mongoose.connect(credentials.mongo.connectionString,opts);

app.engine('.hbs',handlebars.engine);
app.set('view engine','.hbs');

app.set('port',process.env.PORT || 3000);

app.use(require('body-parser')());
app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(morgan('short'));
app.use(function(req,res,next) {
		var cluster = require('cluster');
		if(cluster.isWorker)
			console.log('Worker %d received request.',cluster.worker.id);
		next();
});

//静态资源目录
app.use(express.static(__dirname+'/public'))

//路由
app.get('/',function(req,res) {
	res.render('home');
});

app.get('/about',function(req,res) {
	res.render('about')
});

app.get('/newsletter',function(req,res) {
	res.render('newsletter',{csrf:'CSRF token goes here'});
});

app.post('/process',function(req,res) {
	res.redirect(303,'/thank-you');
});

app.get('/thank-you',function(req,res) {
	res.send('======   Thank You!   ======');
});

app.get('/fail',function(req,res) {
	throw new Error('Nope!');
});

app.get('/epic-fail',function(req,res) {
	process.nextTick(function() {
		throw new Error('Kaboom!');
	});
});

app.get('/vacations',function(req,res) {
	Vacation.find({available:true},function(err,vacations) {
		var context = {
			vacations:vacations.map(function(vacation){
				return{
					sku:vacation.sku,
					name:vacation.name,
					description:vacation.description,
					price:vacation.getDisplayPrice(),
					inSeason:vacation.inSeason,
					
				}
			})
		};
		res.render('vacations',context);
	});

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




function startServer() {
	http.createServer(app).listen(app.get('port'),function() {
			console.log('Express started on http://localhost:'+
				app.get('port')+'; press Ctrl-C to terminate.');
	});
}

if(require.main===module) {
	startServer();
}else{
	module.exports=startServer;
}
