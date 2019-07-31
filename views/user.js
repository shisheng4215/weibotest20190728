exports.login=function(req,res){
	res.render('login');
};

exports.logout=function(req,res) {
	req.session.userName=null;
	res.redirect(303,'/');
};