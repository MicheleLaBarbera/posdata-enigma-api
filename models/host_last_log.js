const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HostLastLogSchema = new Schema({
    host_id: Schema.Types.ObjectId,
    created_at: String,
    host_num_services_crit: Number,
    host_num_services_ok: Number,
    host_num_services_unknown: Number,
    host_num_services_warn: Number,
    hard_state: Number,
    customer_site_id: Schema.Types.ObjectId,
});

const HostLastLog = mongoose.model('hosts_last_logs', HostLastLogSchema);

module.exports = HostLastLog;

