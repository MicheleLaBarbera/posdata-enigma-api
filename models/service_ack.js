const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ServiceAckSchema = new Schema({
    service_id: Schema.Types.ObjectId,
    user_id: Schema.Types.ObjectId,
    message: String,
    created_at: String,
    expire_at: String
});

const ServiceAck = mongoose.model('services_acks', ServiceAckSchema);

module.exports = ServiceAck;