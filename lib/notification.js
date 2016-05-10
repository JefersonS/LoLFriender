var notification = {
	socketIO: require('socket.io')(),
	

	getIo: function(local){
		console.log(local, this.io++);
		return this.io;
	},
	getSocketIo: function(){
		return this.socketIO;
	},
	sendMessage: function(msg){
		this.socketIO.emit('msg', msg);
	}
};

module.exports = notification;