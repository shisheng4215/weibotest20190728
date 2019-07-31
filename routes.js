var user = require('./views/user.js');


module.exports=function(app){
	app.get('/a',function(req,res) {
		res.send('a');
	});
	
	app.get('/login',user.login);
	app.get('/logout',user.logout);
};

