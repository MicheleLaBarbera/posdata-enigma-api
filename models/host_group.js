const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HostGroupSchema = new Schema({
    _id: Schema.Types.ObjectId,
    customer_site_id: Schema.Types.ObjectId,
    name: String,
    alias: String,
    worst_service_state: Number,
    num_hosts_down: Number,
    num_hosts_pending: Number,
    num_hosts_unreach: Number,
    num_hosts_up: Number,
    num_services_crit: Number,
    num_services_ok: Number,
    num_services_pending: Number,
    num_services_unknown: Number,
    num_services_warn: Number,
});

const HostGroup = mongoose.model('host_groups', HostGroupSchema);

module.exports = HostGroup;

