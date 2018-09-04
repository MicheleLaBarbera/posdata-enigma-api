const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CustomerSchema = new Schema({
    name: String,
    //address: String,
    //vat_number: String,
    customer_code: String,
    referent_name: String,
    phone_number: String,
    email: String,
    logo: String
});

const Customer = mongoose.model('customers', CustomerSchema);

module.exports = Customer;

