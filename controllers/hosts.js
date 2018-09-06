const Host = require('../models/host');
const HostLog = require('../models/host_log');
const CustomerSite = require('../models/customer_site');
const Customer = require('../models/customer');
const ServiceLog = require('../models/service_log');
const ServiceAck = require('../models/service_ack');
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
        let results = [];
        await asyncForEach(hosts, async (element) => {
            const host_state = await HostLog.find({ host_id: element._id }).sort({ created_at: -1 }).limit(1);
            if(host_state) {      
                let crit = host_state[0].host_num_services_crit;
                let ok = host_state[0].host_num_services_ok;
                let unknown = host_state[0].host_num_services_unknown;
                let warn = host_state[0].host_num_services_warn;

                const service_acks = await ServiceAck.find({ host_id: element._id, expired: 0 });
                await asyncForEach(service_acks, async (service_ack) => {        
                    const service_log = await ServiceLog.find({ service_id: service_ack.service_id }).sort({ created_at: -1 }).limit(1);

                    if(service_log) {    
                        switch(service_log[0].service_state) {
                            case 1: {
                                warn--;
                                ok++;
                                break;
                            }
                            case 2: {
                                crit--;
                                ok++;       
                                break;
                            }
                            case 3: {
                                unknown--;
                                ok++;
                                break;
                            }
                        }
                    }
                });
                let hostObject = {
                    '_id': element._id,
                    'address': element.host_address,
                    'alias': element.host_alias,
                    'crit': crit,
                    'ok': ok,
                    'unknown': unknown,
                    'warn': warn,
                    'hard_state': host_state[0].hard_state,
                    'acks': element.acks
                };    
                results.push(hostObject);
            }
        });
        res.status(200).json(results);
    },
    getHostsByState: async (req, res, next) => {
        const { stateId } = req.value.params;
        //const hosts_state = await HostLog.find({hard_state: stateId }).sort({ created_at: -1 }).distinct('host_id'); 
        /*const hosts_state = await HostLog.aggregate([
            
            { $sort: { created_at: -1 } },
            { $group : {hard_state : "$stateId", hosts : { $push : "$_id" } } }
        ]);
        console.log(hosts_state);*/
        const hosts = await Host.find();
        let results = [];
        await asyncForEach(hosts, async (element) => {
            const host_state = await HostLog.find({host_id: element._id, hard_state: stateId }).sort({ created_at: -1 }).limit(1);
            if(host_state[0] != null) {     
                let crit = host_state[0].host_num_services_crit;
                let ok = host_state[0].host_num_services_ok;
                let unknown = host_state[0].host_num_services_unknown;
                let warn = host_state[0].host_num_services_warn;

                const service_acks = await ServiceAck.find({ host_id: element._id, expired: 0 });
                await asyncForEach(service_acks, async (service_ack) => {        
                    const service_log = await ServiceLog.find({ service_id: service_ack.service_id }).sort({ created_at: -1 }).limit(1);

                    if(service_log) {    
                        switch(service_log[0].service_state) {
                            case 1: {
                                warn--;
                                ok++;
                                break;
                            }
                            case 2: {
                                crit--;
                                ok++;       
                                break;
                            }
                            case 3: {
                                unknown--;
                                ok++;
                                break;
                            }
                        }
                    }
                });         
                const customer_site = await CustomerSite.findById(element.customer_site_id);
                if(customer_site) {
                    const customer = await Customer.findById(customer_site.customer_id);
                    if(customer) {                    
                        let hostObject = {
                            '_id': element._id,
                            'address': element.host_address,
                            'alias': element.host_alias,
                            'crit': crit,
                            'ok': ok,
                            'unknown': unknown,
                            'warn': warn,
                            'name': customer.name,
                            'site': customer_site.description,
                            'acks': element.acks
                        };
                        results.push(hostObject);
                    }
                }
            }
        });
        res.status(200).json(results);
    },
    getHostLogs: async (req, res, next) => {
        const { hostId } = req.value.params;
        const host_logs = await HostLog.find({host_id: hostId}).sort({ created_at: -1 });
        res.status(200).json(host_logs);
    }
};