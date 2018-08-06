const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HostLogSchema = new Schema({
    host_id: Schema.Types.ObjectId,
    created_at: String,
    host_num_services_crit: Number,
    host_num_services_ok: Number,
    host_num_services_unknown: Number,
    host_num_services_warn: Number,
    hard_state: Number
});

const HostLog = mongoose.model('hosts_logs', HostLogSchema);

module.exports = HostLog;

