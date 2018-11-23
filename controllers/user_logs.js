const UserLog = require('../models/user_log');
const ObjectId = require('mongoose').Types.ObjectId;

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}

module.exports = {    
    getUserLogs: async (req, res, next) => {        
        const { userId, actionType } = req.value.params;   
        console.log(userId + ' - ' + actionType);
        let user_logs = await UserLog.find({ user_id: userId, action_type: actionType }).sort({ created_at: -1 });
        res.status(200).json(user_logs);
    }
};