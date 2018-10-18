const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ServiceCompleteInfoSchema = new Schema({
    _id: Schema.Types.ObjectId,
    service_id: Schema.Types.ObjectId,
    plugin_output: String,
    service_state: Number,
    service_last_state_change: Number,
    host_id: Schema.Types.ObjectId,
    service_last_check: Number,
    created_at: String,
    customer_site_id: Schema.Types.ObjectId,
    host_group_id: Schema.Types.ObjectId,
    previous_state: Number,
    service_logs_docs: {
        name: String,
        host_id: Schema.Types.ObjectId,
        visible: Number
    },
    host_logs_docs: {
        customer_site_id: Schema.Types.ObjectId,
        host_group_id: Schema.Types.ObjectId,
        host_alias: String
    },
    customer_site_logs_docs: {
        description: String,
        customer_id: Schema.Types.ObjectId
    },
    customer_logs_docs: {
        name: String
    }
});

const ServiceCompleteInfo = mongoose.model('services_complete_infos', ServiceCompleteInfoSchema, 'services_complete_infos');

module.exports = ServiceCompleteInfo;