const SchedulerInfo = require('../models/scheduler_info');

module.exports = {
    getLastCheck: async (req, res, next) => {          
        const last_check = await SchedulerInfo.findOne({ name: 'last_check' });
        res.status(200).json(last_check.content);      
    }
};