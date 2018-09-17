const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ServiceLastLogSchema = new Schema({
    service_id: Schema.Types.ObjectId,
    plugin_output: String,
    service_state: Number,
    service_last_state_change: Number,    
    service_last_check: Number,
    created_at: String,
    host_id: Schema.Types.ObjectId,
    host_group_id: Schema.Types.ObjectId,
    customer_site_id: Schema.Types.ObjectId
});

const ServiceLastLog = mongoose.model('services_last_logs', ServiceLastLogSchema);

module.exports = ServiceLastLog;

