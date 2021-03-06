var http = require('http');
var express = require('express');
var handlebars = require('express-handlebars').create({defaultLayout:'main',extname:'.hbs'});
var app = express();
var credentials = require('./credentials.js');
var morgan = require('morgan');
var mongoose = require('mongoose');
var opts = {useNewUrlParser:true};
var Vacation = require('./models/vacation.js');
var VacationInSeasonListener = require('./models/vacationInSeasonListener.js');
var User = require('./models/user.js');
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

//连接数据库
mongoose.connect(credentials.mongo.connectionString,opts);

app.engine('.hbs',handlebars.engine);
app.set('view engine','.hbs');

app.set('port',process.env.PORT || 3000);

app.use(bodyParser.urlencoded({extended:false}));
app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(morgan('short'));
app.use(function(req,res,next) {
		var cluster = require('cluster');
		if(cluster.isWorker)
			console.log('Worker %d received request.',cluster.worker.id);
		next();
});

app.use(session({

	store:new MongoStore({mongooseConnection:mongoose.connection})
	
}));

//静态资源目录
app.use(express.static(__dirname+'/public'))

//路由
app.get('/',function(req,res) {

	var context={
		userName:req.session.userName,
	}
	console.log(context);
	res.render('home',context);
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
		var currency=req.session.currency||'USD';
		var context = {
			currency:currency,
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
		console.log(currency);
		switch(currency){
			case 'USD': context.currencyUSD='selected';break;
			case 'GBP': context.currencyGBP='selected';break;
			case 'BTC': context.currencyBTC='selected';break;
		}
		res.render('vacations',context);
	});

});


app.get('/notify-me-when-in-season',function(req,res) {
	res.render('notify-me-when-in-season',{sku:req.query.sku});
});

app.post('/notify-me-when-in-season',function(req,res) {
	VacationInSeasonListener.update(
		{email:req.body.email},
		{$push:{skus:req.body.sku}},
		{upsert:true},
		function(err){
			if(err)
				console.error(err.stack);
			return res.redirect(303,'/vacations');
		}

	)
});

app.get('/create-user',function(req,res) {
	res.render('create-user');
});


app.post('/create-user',function(req,res) {
	new User({
		userName:req.body.userName,
		name:req.body.name,
		email:req.body.email,
	}).save();
	
	res.redirect(303,'/thank-you');

});

app.get('/users',function(req,res) {
	var id=1;
	User.find(function(err,users) {
		if(err) return console.log(err.stack);
		var context = {
			users:users.map(function(user){
				return{
					userName:user.userName,
					name:user.name,
					email:user.email,
					id:user._id,
				}
			})
		}
		res.render('users',context);
	});

});

app.get('/set-currency/:currency',function(req,res) {
	req.session.currency=req.params.currency;
	return res.redirect(303,'/vacations');
});



app.post('/login',function(req,res) {
	var userName = req.body.userName;
	var password = req.body.password;
	//验证密码
	
	req.session.userName=userName;
	res.redirect(303,'/');
});





require('./routes.js')(app);



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
