const Host = require('../models/host');
const Service = require('../models/service');
const ServiceLog = require('../models/service_log');
const ServiceAck = require('../models/service_ack');
const User = require('../models/user');
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
        let results = [];
        await asyncForEach(services, async (element) => {
            const service_state = await ServiceLog.find({ service_id: element._id }).sort({ created_at: -1 }).limit(1);
            if(service_state) {    
                let last_change = new Date(service_state[0].service_last_state_change*1000);
                let last_year = last_change.getFullYear();
                let last_month = last_change.getMonth() + 1;
                last_month = (last_month <= 9) ? "0" + last_month : last_month;
                let last_day = last_change.getDate();
                last_day = (last_day <= 9) ? "0" + last_day : last_day;
                let last_hours = "0" + last_change.getHours();
                let last_minutes = "0" + last_change.getMinutes();                
                let last_seconds = "0" + last_change.getSeconds();
                let last_formattedTime = last_day + '-' + last_month + '-' + last_year;
                let last_formattedTime_ex = last_hours.substr(-2) + ':' + last_minutes.substr(-2) + ':' + last_seconds.substr(-2);

                let check_change = new Date(service_state[0].service_last_check*1000);
                let check_year = check_change.getFullYear();
                let check_month = check_change.getMonth() + 1;
                check_month = (check_month <= 9) ? "0" + check_month : check_month;
                let check_day = check_change.getDate();
                check_day = (check_day <= 9) ? "0" + check_day : check_day;
                let check_hours = "0" + check_change.getHours();
                let check_minutes = "0" + check_change.getMinutes();
                let check_seconds = "0" + check_change.getSeconds();
                let check_formattedTime = check_year + '-' + check_day + '-' + check_month;
                let check_formattedTime_ex = check_hours.substr(-2) + ':' + check_minutes.substr(-2) + ':' + check_seconds.substr(-2);

                let service_ack = await ServiceAck.find({ service_id: element._id, expired: 0 }).sort({ created_at: -1 }).limit(1);
                let serviceAckObject = {};
                if(service_ack[0] != null) {                    
                    const creator = await User.findById(service_ack[0].user_id);
                    serviceAckObject = {
                        '_id': service_ack[0]._id,
                        'service_id': service_ack[0].service_id,
                        'creator_name': creator.username,
                        'message': service_ack[0].message,
                        'created_at': service_ack[0].created_at
                    };                
                }

                var serviceObject = {
                    '_id': element._id,
                    'host_id': element.host_id,
                    'name': element.name,
                    'status': service_state[0].plugin_output,
                    'age': last_formattedTime,
                    'age_min': last_formattedTime_ex,
                    'state': service_state[0].service_state,
                    'h_name': service_state[0].host_name,
                    'last_check': check_formattedTime,
                    'last_check_min': check_formattedTime_ex,
                    'ack': serviceAckObject
                }          
                results.push(serviceObject);
            }
        });
        res.status(200).json(results);
    },
    newServiceAck: async (req, res, next) => {     
        const newServiceAck = new ServiceAck(req.value.body);
        let serviceAckObject = {};
        const serviceAck = await newServiceAck.save();
        const creator = await User.findById(req.value.body.user_id);
        serviceAckObject = {
            '_id': serviceAck._id,
            'host_id': serviceAck.host_id,
            'service_id': serviceAck.service_id,
            'creator_name': creator.username,
            'message': serviceAck.message,
            'created_at': serviceAck.created_at,
            'expired': serviceAck.expired
        };
        const host = await Host.findById(req.value.body.host_id);
        host.acks++;
        await host.save();

        res.status(201).json({
            'status': 201,
            'body': {
                'message': serviceAckObject
            }
        });
    },
    getServiceAcks: async (req, res, next) => {
        const { serviceId } = req.value.params;
        const service_ack = await ServiceAck.find({ service_id: serviceId }).sort({ created_at: -1 }).limit(1);
        let serviceAckObject = {};
        if(service_ack) {
            const creator = await User.findById(service_ack[0].user_id);
            serviceAckObject = {
                '_id': service_ack[0]._id,
                'service_id': service_ack[0].service_id,
                'creator_name': creator.username,
                'message': service_ack[0].message,
                'created_at': service_ack[0].created_at
            };
        }
        res.status(200).json(serviceAckObject);
    },
    getServiceLogs: async (req, res, next) => {
        const { serviceId } = req.value.params;
        const service_logs = await ServiceLog.find({ service_id: serviceId }).sort({ created_at: -1 });
        let results = [];
        let serviceLogObject = {};
        await asyncForEach(service_logs, async (element) => {
            let check_change = new Date(element.service_last_check*1000);
            let check_year = check_change.getFullYear();
            let check_month = check_change.getMonth() + 1;
            check_month = (check_month <= 9) ? "0" + check_month : check_month;
            let check_day = check_change.getDate();
            check_day = (check_day <= 9) ? "0" + check_day : check_day;
            let check_hours = "0" + check_change.getHours();
            let check_minutes = "0" + check_change.getMinutes();
            let check_seconds = "0" + check_change.getSeconds();
            let check_formattedTime = check_year + '-' + check_day + '-' + check_month;
            let check_formattedTime_ex = check_hours.substr(-2) + ':' + check_minutes.substr(-2) + ':' + check_seconds.substr(-2);
            let full_date = check_formattedTime + ' ' + check_formattedTime_ex;
     
            serviceLogObject = {
                '_id': element._id,
                'service_id': element.service_id,
                'plugin_output': element.plugin_output,
                'service_state': element.service_state,
                'service_last_check': full_date,
                'created_at': element.created_at            
            };
            results.push(serviceLogObject);
        });
        res.status(200).json(results);
    },
    deleteServiceAck: async (req, res, next) => {
        const { ackId } = req.value.params;
        const service_ack = await ServiceAck.findById(ackId);
        service_ack.expired = 1;
        await service_ack.save();
        
        const host = await Host.findById(service_ack.host_id);
        host.acks--;
        await host.save();

        res.status(200).json({ 
            'status': 200,
            'body': {
                'success': true
            } 
        });
    }
};