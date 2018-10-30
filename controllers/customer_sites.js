const CustomerSiteLastLog = require('../models/customer_site_last_log');
const Host = require('../models/host');
const HostLog = require('../models/host_log');
const CustomerSite = require('../models/customer_site');
const Customer = require('../models/customer');
const ServiceLog = require('../models/service_log');
const ServiceLastLog = require('../models/service_last_log');
const ServiceAck = require('../models/service_ack');
const ObjectId = require('mongoose').Types.ObjectId;
const ServiceCompleteInfo = require('../models/service_complete_info');
const HostCompleteInfo = require('../models/host_complete_info');
const Service = require('../models/service');
const User = require('../models/user');
const HostLastLog = require('../models/host_last_log');

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
    getCustomerSiteState: async (req, res, next) => {          
        const { siteId } = req.value.params;
        const last_log = await CustomerSiteLastLog.findOne({ customer_site_id: siteId });
        res.status(200).json(last_log.state);      
    },
    replaceCustomerSite: async (req, res, next) => {
        const { siteId } = req.value.params;
        const newCustomerSite = req.value.body;

        const result = await CustomerSite.findByIdAndUpdate(siteId, newCustomerSite);
    
        res.status(200).json({ 
            'status': 200,
            'body': {
                'success': true
            } 
        });
    },
    getCustomerSiteServicesByState: async (req, res, next) => {
        const { siteId, stateId } = req.value.params;
        let results = [];
        if(stateId != 4) {            
            const services_last_log = await ServiceCompleteInfo.find({ customer_site_id: siteId, service_state: stateId });      
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
                                        created_at: element.created_at,
                                        updated_at: '',
                                        author: '',
                                        _id: '',
                                        service_id: '',
                                        code: ''
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
                                    created_at: element.created_at,
                                    updated_at: '',
                                    author: '',
                                    _id: '',
                                    service_id: '',
                                    code: ''
                                };
                                results.push(myObject);
                            }
                        }
                    }
                }
            });   
        }
        else {
            const services_acks = await ServiceAck.find({customer_site_id: siteId, expired: 0}); 
            if(services_acks) {
                await asyncForEach(services_acks, async (element) => {   
                    let service = await Service.findById(element.service_id);                            
                    if(service) {
                        if(service.visible) {
                            let host = await Host.findById(service.host_id);                        
                            if(host) {                                
                                let customer_site = await CustomerSite.findById(host.customer_site_id);
                                if(customer_site) {
                                    let customer = await Customer.findById(customer_site.customer_id);
                                    if(customer) {
                                        let user = await User.findById(element.user_id);
                                        if(user) {
                                            let myObject = {
                                                customer_name: customer.name,
                                                customer_site_description: customer_site.description,
                                                host_alias: host.host_alias,
                                                service_name: service.name,
                                                plugin_output: element.message,
                                                created_at: element.created_at,
                                                updated_at: element.updated_at,
                                                author: user.firstname + ' ' + user.lastname,
                                                _id: element._id,
                                                service_id: service._id,
                                                code: element.code
                                            };
                                            results.push(myObject);
                                        }
                                    }
                                }
                            }
                        }
                    }      
                });                  
            }
        }  
        res.status(200).json(results.sort(predicate('customer_name', 'customer_site_description', 'host_alias', 'service_name')));
    },
    getCustomerSiteHostsByState: async (req, res, next) => {
        const { siteId, stateId } = req.value.params;
        let results = [];

        const customers = await Customer.find();
        const customer_sites = await CustomerSite.find();
        const hosts = await Host.find(); 
        const service_acks = await ServiceAck.find({ expired: 0 });

        if(hosts) {
            await asyncForEach(hosts, async (element) => {
                const host_state = await HostLastLog.findOne({host_id: element._id });   
                if(host_state != null) {    
                    if(host_state.hard_state == stateId && host_state.customer_site_id == siteId) { 
                        let crit = host_state.host_num_services_crit;
                        let ok = host_state.host_num_services_ok;
                        let unknown = host_state.host_num_services_unknown;
                        let warn = host_state.host_num_services_warn;
                        let ack = 0;

                        await asyncForEach(service_acks, async (service_ack) => {  
                            if(JSON.stringify(service_ack.host_id) == JSON.stringify(host_state.host_id)) {                              
                                const service_log = await ServiceLastLog.find({ service_id: service_ack.service_id }).sort({ created_at: -1 }).limit(1);
                
                                if(service_log[0] != null) {    
                                    switch(service_log[0].service_state) {
                                        case 1: {
                                            warn--;
                                            ack++;
                                            break;
                                        }
                                        case 2: {
                                            crit--;
                                            ack++;
                                            break;
                                        }
                                        case 3: {
                                            unknown--;
                                            ack++;
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
                                            'acks': element.acks,
                                            'ack_num': ack
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
};