const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ServiceLastLogSchema = new Schema({
    _id: Schema.Types.ObjectId,
    created_at: String
});

const ServiceLastLog = mongoose.model('services_last_log', ServiceLastLogSchema, 'services_last_log');

module.exports = ServiceLastLog;