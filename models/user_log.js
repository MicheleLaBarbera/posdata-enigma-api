const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserLogSchema = new Schema({
    user_id: Schema.Types.ObjectId,
    action_type: Number,
    message: String,
    created_at: String,
    receiver_id: Schema.Types.ObjectId
});

const UserLog = mongoose.model('users_logs', UserLogSchema);

module.exports = UserLog;