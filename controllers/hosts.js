const Host = require('../models/host');
const HostLog = require('../models/host_log');
const ObjectId = require('mongoose').Types.ObjectId;

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}

module.exports = {
    getHostgroupHosts: async (req, res, next) => {
        const { hostGroupId } = req.value.params;
        const hosts = await Host.find({ host_group_id: hostGroupId});
        var results = [];
        await asyncForEach(hosts, async (element) => {
            const host_state = await HostLog.find({ host_id: element._id }).sort({ created_at: -1 }).limit(1);
            if(host_state) {      
                var hostObject = {
                    '_id': element._id,
                    'address': element.host_address,
                    'alias': element.host_alias,
                    'crit': host_state[0].host_num_services_crit,
                    'ok': host_state[0].host_num_services_ok,
                    'unknown': host_state[0].host_num_services_unknown,
                    'warn': host_state[0].host_num_services_warn,
                    'hard_state': host_state[0].hard_state
                }          
                results.push(hostObject);
            }
        });
        res.status(200).json(results);
    }
};