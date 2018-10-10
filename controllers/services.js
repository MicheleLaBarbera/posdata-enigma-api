const Host = require('../models/host');
const Service = require('../models/service');
const ServiceLog = require('../models/service_log');
const ServiceLastLog = require('../models/service_last_log');
const ServiceAck = require('../models/service_ack');
const User = require('../models/user');
const ServiceCompleteInfo = require('../models/service_complete_info');
const HostCompleteInfo = require('../models/host_complete_info');
const ObjectId = require('mongoose').Types.ObjectId;

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}

function predicate() {
    var fields = [], n_fields = arguments.length, field, name, reverse, cmp;

    var default_cmp = function (a, b) {
        if (a === b) return 0;
        return a < b ? -1 : 1;
        },
        getCmpFunc = function (primer, reverse) {
        var dfc = default_cmp,
            // closer in scope
            cmp = default_cmp;
        if (primer) {
            cmp = function (a, b) {
            return dfc(primer(a), primer(b));
            };
        }
        if (reverse) {
            return function (a, b) {
            return -1 * cmp(a, b);
            };
        }
        return cmp;
        };

    // preprocess sorting options
    for (var i = 0; i < n_fields; i++) {
        field = arguments[i];
        if (typeof field === 'string') {
        name = field;
        cmp = default_cmp;
        } else {
        name = field.name;
        cmp = getCmpFunc(field.primer, field.reverse);
        }
        fields.push({
        name: name,
        cmp: cmp
        });
    }

    // final comparison function
    return function (A, B) {
        var a, b, name, result;
        for (var i = 0; i < n_fields; i++) {
        result = 0;
        field = fields[i];
        name = field.name;

        result = field.cmp(A[name], B[name]);
        if (result !== 0) break;
        }
        return result;
    };
}

module.exports = {
    getHostServices: async (req, res, next) => {
        const { hostId } = req.value.params;
        let results = [];

        const services_last_log = await ServiceLastLog.find({ host_id: hostId });
        await asyncForEach(services_last_log, async (element) => {
            let service = await Service.findById(element.service_id);                            
            if(service) {
                if(service.visible) {
                    let service_ack = await ServiceAck.find({ service_id: element.service_id, expired: 0 }).sort({ created_at: -1 }).limit(1);
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
                    //let service = await Service.findById(element.service_id);

                    if(element.service_state == 2)
                        element.service_state = 0;
                    else if(element.service_state == 0)
                        element.service_state = 2;

                    let serviceObject = {
                        '_id': element.service_id,
                        'host_id': element.host_id,
                        'name': service.name,
                        'status': element.plugin_output,               
                        'state': element.service_state,             
                        'ack': serviceAckObject
                    }          
                    results.push(serviceObject);
                }
            }
        });

        /*const services = await Service.find({ host_id: hostId});
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
        });*/
        //console.log(results);
        //res.status(200).json(results.sort(predicate('state', 'name')));
        //let newObj = results.sort(predicate('state', 'name'));

        //console.log(newObj.reverse());
        res.status(200).json(results.sort(predicate('state', 'name')));
        //res.status(200).json(results);
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
    },
    getServicesByState: async (req, res, next) => {
        const { stateId } = req.value.params;
        let results = [];
        const services_last_log = await ServiceCompleteInfo.find({ service_state: stateId });      

        await asyncForEach(services_last_log, async (element) => {   
            let service = await Service.findById(element.service_id);                            
            if(service) {
                if(service.visible) {     
                    if(element.service_state == stateId) {              
                        if(stateId != 0) {
                            const service_ack = await ServiceAck.findOne({ service_id: element.service_id, expired: 0 });
                      
                            if(!service_ack) {                     
                                let myObject = {
                                    customer_name: element.customer_logs_docs.name,
                                    customer_site_description: element.customer_site_logs_docs.description,
                                    host_alias: element.host_logs_docs.host_alias,
                                    service_name: element.service_logs_docs.name,
                                    plugin_output: element.plugin_output,
                                    created_at: element.created_at
                                };
                                results.push(myObject);
                            }
                        }
                        else {
                            let myObject = {
                                customer_name: element.customer_logs_docs.name,
                                customer_site_description: element.customer_site_logs_docs.description,
                                host_alias: element.host_logs_docs.host_alias,
                                service_name: element.service_logs_docs.name,
                                plugin_output: element.plugin_output,
                                created_at: element.created_at
                            };
                            results.push(myObject);
                        }
                    }
                }
            }
        });     
        res.status(200).json(results.sort(predicate('customer_name', 'customer_site_description', 'host_alias', 'service_name')));

    },
    getServicesChange: async (req, res, next) => {
        let results = [];
        const services_last_log = await ServiceCompleteInfo.find().sort({ created_at: -1 }).limit(30);
        
        await asyncForEach(services_last_log, async (element) => {        
            const service_ack = await ServiceAck.findOne({ service_id: element.service_id, expired: 0 });            
            if(!service_ack) {              
                let split = element.created_at.split(" ");
                let date = split[0].split('-');
                let time = split[1].split(':') ;
                let timestamp = new Date(date[0], date[1] - 1, date[2], time[0], time[1], time[2]).getTime();     

                let new_customer_name = element.customer_logs_docs.name;
                if(new_customer_name.length > 22) {
                    new_customer_name = element.customer_logs_docs.name.substring(0, 22 - 2);
                    new_customer_name = new_customer_name + "..";
                }

                let new_host_alias = element.host_logs_docs.host_alias;
                
                if(new_host_alias.length > 22) {
                    new_host_alias = element.host_logs_docs.host_alias.substring(0, 22 - 2);
                    new_host_alias = new_host_alias + "..";
                }

                let new_service_name = element.service_logs_docs.name;
                if(new_service_name.length > 22) {
                    new_service_name = element.service_logs_docs.name.substring(0, 22 - 2);
                    new_service_name = new_service_name + "..";
                }

                let myObject = {                    
                    customer_name: new_customer_name,
                    customer_site_description: element.customer_site_logs_docs.description,
                    host_alias: new_host_alias,
                    service_name: new_service_name,
                    plugin_output: element.service_state,
                    created_at: timestamp,
                    date: '',
                    time: '',
                    customer_site_id: element.customer_site_id,
                    host_group_id: element.host_group_id
                };
                results.push(myObject);
            }        
        });   

        const hosts_last_log = await HostCompleteInfo.find().sort({ created_at: -1 }).limit(30);

        await asyncForEach(hosts_last_log, async (element) => {
            let split = element.created_at.split(" ");
            let date = split[0].split('-');
            let time = split[1].split(':') ;
            let timestamp = new Date(date[0], date[1] - 1, date[2], time[0], time[1], time[2]).getTime();

            let new_customer_name = element.customer_logs_docs.name;
            if(new_customer_name.length > 22) {
                new_customer_name = element.customer_logs_docs.name.substring(0, 22 - 2);
                new_customer_name = new_customer_name + "..";
            }

            let new_host_alias = element.host_logs_docs.host_alias;
            if(new_host_alias.length > 22) {
                new_host_alias = element.host_logs_docs.host_alias.substring(0, 22 - 2);
                new_host_alias = new_host_alias + "..";
            }

            let myObject = {
                customer_name: new_customer_name,
                customer_site_description: element.customer_site_logs_docs.description,
                host_alias: new_host_alias,
                service_name: '',
                plugin_output: element.hard_state + 4,
                created_at: timestamp,
                date: '',
                time: '',
                customer_site_id: element.customer_site_id,
                host_group_id: element.host_group_id
            };
            results.push(myObject);
        });

        let records = results.sort(predicate('created_at'));
        let startFrom = records.length;
        let response = [];
        for(let i = startFrom - 1; i > startFrom - 31; i--) {
            let check_change = new Date(records[i].created_at);
            let check_year = check_change.getFullYear();
            //let check_month = check_change.getMonth() + 1;
            //check_month = (check_month <= 9) ? "0" + check_month : check_month;
            let check_day = check_change.getDate();
            check_day = (check_day <= 9) ? "0" + check_day : check_day;
            let check_hours = "0" + check_change.getHours();
            let check_minutes = "0" + check_change.getMinutes();
            let check_seconds = "0" + check_change.getSeconds();

            let months = [
                'Gen',
                'Feb',
                'Mar',
                'Apr',
                'Mag',
                'Giu',
                'Lug',
                'Ago',
                'Set',
                'Ott',
                'Nov',
                'Dic'
            ]

            let check_formattedTime = check_day + ' ' + months[check_change.getMonth()] + '.';
            let check_formattedTime_ex = check_hours.substr(-2) + ':' + check_minutes.substr(-2);
            records[i].created_at = check_formattedTime + ' ' + check_formattedTime_ex;

            records[i].date = check_formattedTime;
            records[i].time = check_formattedTime_ex;

            response.push(records[i]);
        }
        
        res.status(200).json(response);
    },
};