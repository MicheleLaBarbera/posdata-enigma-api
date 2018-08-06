const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ServiceSchema = new Schema({
    host_id: Schema.Types.ObjectId,
    name: String
});

const Service = mongoose.model('services', ServiceSchema);

module.exports = Service;