const mongoose = require('mongoose')
const mongoURI = 'mongodb+srv://imsHP:imsHP@cluster0-exoql.mongodb.net/test?retryWrites=true&w=majority';

const conn = mongoose.createConnection(mongoURI, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});
const test=conn.model('test',{

	userID:{
		type:String,
		// required: true
	},
	file:{
		type:String
	}
})

module.exports =test