const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CustomerSiteLogSchema = new Schema({

    customer_site_id: Schema.Types.ObjectId,
    created_at: String,
    state: Number
});

const CustomerSiteLog = mongoose.model('customers_sites_logs', CustomerSiteLogSchema);

module.exports = CustomerSiteLog;