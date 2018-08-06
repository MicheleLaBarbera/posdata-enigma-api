const Service = require('../models/service');
const ServiceLog = require('../models/service_log');
const ObjectId = require('mongoose').Types.ObjectId;

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}

module.exports = {
    getHostServices: async (req, res, next) => {
        const { hostId } = req.value.params;
        const services = await Service.find({ host_id: hostId});
        var results = [];
        await asyncForEach(services, async (element) => {
            const service_state = await ServiceLog.find({ service_id: element._id }).sort({ created_at: -1 }).limit(1);
            if(service_state) {    
                var last_change = new Date(service_state[0].service_last_state_change*1000);
                var last_year = last_change.getFullYear();
                var last_month = last_change.getMonth() + 1;
                last_month = (last_month <= 9) ? "0" + last_month : last_month;
                var last_day = last_change.getDate();
                last_day = (last_day <= 9) ? "0" + last_day : last_day;
                var last_hours = "0" + last_change.getHours();
                var last_minutes = "0" + last_change.getMinutes();                
                var last_seconds = "0" + last_change.getSeconds();
                var last_formattedTime = last_day + '-' + last_month + '-' + last_year;
                var last_formattedTime_ex = last_hours.substr(-2) + ':' + last_minutes.substr(-2) + ':' + last_seconds.substr(-2);

                var check_change = new Date(service_state[0].service_last_check*1000);
                var check_year = check_change.getFullYear();
                var check_month = check_change.getMonth() + 1;
                check_month = (check_month <= 9) ? "0" + check_month : check_month;
                var check_day = check_change.getDate();
                check_day = (check_day <= 9) ? "0" + check_day : check_day;
                var check_hours = "0" + check_change.getHours();
                var check_minutes = "0" + check_change.getMinutes();
                var check_seconds = "0" + check_change.getSeconds();
                var check_formattedTime = check_day + '-' + check_month + '-' + check_year;
                var check_formattedTime_ex = check_hours.substr(-2) + ':' + check_minutes.substr(-2) + ':' + check_seconds.substr(-2);

                var serviceObject = {
                    'name': element.name,
                    'status': service_state[0].plugin_output,
                    'age': last_formattedTime,
                    'age_min': last_formattedTime_ex,
                    'state': service_state[0].service_state,
                    'h_name': service_state[0].host_name,
                    'last_check': check_formattedTime,
                    'last_check_min': check_formattedTime_ex
                }          
                results.push(serviceObject);
            }
        });
        res.status(200).json(results);
    }
};