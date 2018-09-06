const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserCustomerSiteSchema = new Schema({

    user_id: Schema.Types.ObjectId,
    customer_site_id: Schema.Types.ObjectId,
    notification: Number,
    telegram: Number,
    email: Number,
    sms: Number
});

const UserCustomerSite = mongoose.model('user_customer_sites', UserCustomerSiteSchema);

module.exports = UserCustomerSite;
