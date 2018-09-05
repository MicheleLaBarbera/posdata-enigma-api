const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HostSchema = new Schema({
    _id: Schema.Types.ObjectId,
    customer_site_id: Schema.Types.ObjectId,
    host_group_id: Schema.Types.ObjectId,
    name: String,
    host_address: String,
    host_alias: String,
    acks: Number
});

const Host = mongoose.model('hosts', HostSchema);

module.exports = Host;