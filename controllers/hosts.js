const Host = require('../models/host');
const HostLog = require('../models/host_log');
const HostLastLog = require('../models/host_last_log');
const CustomerSite = require('../models/customer_site');
const Customer = require('../models/customer');
const ServiceLog = require('../models/service_log');
const ServiceLastLog = require('../models/service_last_log');
const ServiceAck = require('../models/service_ack');
const ObjectId = require('mongoose').Types.ObjectId;

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}

function sortByKey(array, key) {
    return array.sort(function(a, b) {
        var x = a[key]; var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
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
    getHostgroupHosts: async (req, res, next) => {
        const { hostGroupId } = req.value.params;
        const hosts = await Host.find({ host_group_id: hostGroupId});
        let results = [];
        const service_acks = await ServiceAck.find({ expired: 0 });
        await asyncForEach(hosts, async (element) => {
            const host_state = await HostLastLog.findOne({ host_id: element._id });
            console.log(host_state);
            if(host_state) {      
                let crit = host_state.host_num_services_crit;
                let ok = host_state.host_num_services_ok;
                let unknown = host_state.host_num_services_unknown;
                let warn = host_state.host_num_services_warn;

                await asyncForEach(service_acks, async (service_ack) => {      
                    if(JSON.stringify(service_ack.host_id) == JSON.stringify(host_state.host_id)) {        
                        const service_log = await ServiceLastLog.find({ service_id: service_ack.service_id }).sort({ created_at: -1 }).limit(1);

                        if(service_log[0] != null) {    
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
                    'hard_state': host_state.hard_state,
                    'acks': element.acks
                };    
                results.push(hostObject);
            }
        });
        res.status(200).json(results);
    },
    getHostsByState: async (req, res, next) => {
        const { stateId } = req.value.params;
        let results = [];

        const customers = await Customer.find();
        const customer_sites = await CustomerSite.find();
        const hosts = await Host.find(); 
        const service_acks = await ServiceAck.find({ expired: 0 });

        if(hosts) {
            await asyncForEach(hosts, async (element) => {
                const host_state = await HostLastLog.findOne({host_id: element._id });                                    
                if(host_state != null) {    
                    if(host_state.hard_state == stateId) { 
                        let crit = host_state.host_num_services_crit;
                        let ok = host_state.host_num_services_ok;
                        let unknown = host_state.host_num_services_unknown;
                        let warn = host_state.host_num_services_warn;

                        await asyncForEach(service_acks, async (service_ack) => {  
                            if(JSON.stringify(service_ack.host_id) == JSON.stringify(host_state.host_id)) {                              
                                const service_log = await ServiceLastLog.find({ service_id: service_ack.service_id }).sort({ created_at: -1 }).limit(1);
                
                                if(service_log[0] != null) {    
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
                            }
                        }); 

                        customer_sites.forEach(customer_site => {                     
                            if(JSON.stringify(element.customer_site_id) == JSON.stringify(customer_site._id)) {                          
                                customers.forEach(customer => {                                
                                    if(JSON.stringify(customer._id) === JSON.stringify(customer_site.customer_id)) {
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
                                });
                            }
                        });
                    }                    
                }
            });
        }       
        res.status(200).json(results.sort(predicate('name', 'site', 'alias')));
    },    
    getHostLogs: async (req, res, next) => {
        const { hostId } = req.value.params;
        const host_logs = await HostLog.find({host_id: hostId}).sort({ created_at: -1 });

        let results = [];
        let oldState = -1;
        await asyncForEach(host_logs, async (element) => {            
            if(element.hard_state != oldState) {
                let hostObject = {
                    "_id": element._id,              
                    "host_id": element.host_id,                 
                    "created_at": element.created_at,                   
                    "host_num_services_crit": element.host_num_services_crit,                    
                    "host_num_services_ok": element.host_num_services_ok,                   
                    "host_num_services_unknown": element.host_num_services_unknown,                    
                    "host_num_services_warn": element.host_num_services_warn,                    
                    "hard_state": element.hard_state                   
                };
                oldState = element.hard_state;
                results.push(hostObject);
            }            
        });
        res.status(200).json(results);
    }
};