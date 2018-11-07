const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: String,
    password: String, 
    firstname: String,
    lastname: String, 
    email: String,
    role: Number,
    telegram_id: String,
    customer_name: String,
    reset_password_token: String,
  	reset_password_expires: Date,
    deleted: Number,
    customer_id: String,
    phone_number: String,
    office_number: String
});

const User = mongoose.model('users', UserSchema);

module.exports = User;