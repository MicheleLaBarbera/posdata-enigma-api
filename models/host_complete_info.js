const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HostCompleteInfoSchema = new Schema({
    _id: Schema.Types.ObjectId,
    host_id: Schema.Types.ObjectId,
    host_num_services_crit: Number,
    host_num_services_ok: Number,
    host_num_services_unknown: Number,
    host_num_services_warn: Number,
    hard_state: Number,
    created_at: String,
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

const HostCompleteInfo = mongoose.model('hosts_complete_infos', HostCompleteInfoSchema, 'hosts_complete_infos');

module.exports = HostCompleteInfo;