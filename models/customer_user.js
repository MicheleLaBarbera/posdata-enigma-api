const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CustomerUserSchema = new Schema({
    customer_id: Schema.Types.ObjectId,
    user_id: Schema.Types.ObjectId
});

const CustomerUser = mongoose.model('customers_users', CustomerUserSchema);

module.exports = CustomerUser;