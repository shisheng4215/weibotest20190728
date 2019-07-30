var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
	userName:String,
	name:String,
	email:String,
	createDate:Date,
});

userSchema.methods.GetUserInfo=function(){
	return {
		userName:this.userName,
		name:this.name,
		email:this.email,
	};
};

var User = mongoose.model('User',userSchema);

module.exports=User;