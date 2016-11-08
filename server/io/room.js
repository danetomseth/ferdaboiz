function Room(name, id) {
	this.name = name;
	this.id = id;
	this.status = 'online';
	this.people = [];
}

Room.prototype.addClient = function(clientId) {
	if(this.status === 'online') {
		this.people.push(clientId)
	}
}

module.exports = Room;