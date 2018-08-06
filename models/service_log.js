const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ServiceLogSchema = new Schema({
    service_id: Schema.Types.ObjectId,
    plugin_output: String,
    service_state: Number,
    service_last_state_change: Number,
    host_name: String,
    service_last_check: Number,
    created_at: String
});

const ServiceLog = mongoose.model('services_logs', ServiceLogSchema);

module.exports = ServiceLog;

