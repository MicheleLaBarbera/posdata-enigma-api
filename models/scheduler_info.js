const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SchedulerInfoSchema = new Schema({
    name: String,
    content: String
});

const SchedulerInfo = mongoose.model('scheduler_infos', SchedulerInfoSchema);

module.exports = SchedulerInfo;
