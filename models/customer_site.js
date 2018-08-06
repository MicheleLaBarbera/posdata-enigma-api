const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CustomerSiteSchema = new Schema({

    customer_id: Schema.Types.ObjectId,
    ip_address: String,
    port_number: Number,
    description: String
});

const CustomerSite = mongoose.model('customers_sites', CustomerSiteSchema);

module.exports = CustomerSite;