const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CustomerSiteLastLogSchema = new Schema({

    customer_site_id: Schema.Types.ObjectId,
    created_at: String,
    state: Number
});

const CustomerSiteLastLog = mongoose.model('customers_sites_last_logs', CustomerSiteLastLogSchema, 'customer_sites_last_logs');

module.exports = CustomerSiteLastLog;