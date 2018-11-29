const Customer = require('../models/customer');
const CustomerSite = require('../models/customer_site');
const UserLog = require('../models/user_log');
const User = require('../models/user');
const UserCustomerSite = require('../models/user_customer_site');
const CustomerSiteLog = require('../models/customer_site_log');
const CustomerSiteLastLog = require('../models/customer_site_last_log');
const Host = require('../models/host');
const HostLog = require('../models/host_log');
const HostGroup = require('../models/host_group');
const ServiceLog = require('../models/service_log');
const ServiceAck = require('../models/service_ack');
const ObjectId = require('mongoose').Types.ObjectId;
let { verifyJWT } = require('../helpers/auth');

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}

async function insertLog(user_id, action_type, message, receiver_id) {   
    let d = new Date();
    let check_year = d.getFullYear();
    let check_month;
    check_month = d.getMonth() + 1;
    check_month = (check_month <= 9) ? "0" + check_month : check_month;
    let check_day;
    check_day = d.getDate();
    check_day = (check_day <= 9) ? "0" + check_day : check_day;
    let check_hours = "0" + d.getHours();
    let check_minutes = "0" + d.getMinutes();
    let check_seconds = "0" + d.getSeconds();
    let check_formattedTime = check_year + '-' + check_day + '-' + check_month;
    let check_formattedTime_ex = check_hours.substr(-2) + ':' + check_minutes.substr(-2) + ':' + check_seconds.substr(-2);
    
    let final = check_formattedTime + ' ' + check_formattedTime_ex;

    let newUserLog = new UserLog({
        'user_id': user_id,
        'action_type': action_type,
        'message': message,
        'created_at': final,
        'receiver_id': receiver_id
    });
    
    const userLog = await newUserLog.save();
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
    index: async (req, res, next) => {          
        const customers = await Customer.find({});
        res.status(200).json(customers.sort(predicate('name')));     
    },
    newCustomer: async (req, res, next) => {   
        const newCustomer = new Customer(req.value.body);           
        const customer = await newCustomer.save();

        let token = req.get('Authorization');
        
        verifyJWT(token).then(decodedToken => {
            req.user = decodedToken.data;
            let user_id = req.user.id;

            insertLog(user_id, 0, 'Nome: ' + customer.name + ' - Codice: ' + customer.customer_code, customer._id);
            
            res.status(201).json({
                'status': 201,
                'body': {
                    'message': 'Cliente registrato con successo.'
                }
            });
        });           
    },
    getCustomerSites: async (req, res, next) => {
        const { customerId } = req.value.params;
        const customerSites = await CustomerSite.find({ customer_id: customerId});
        res.status(200).json(customerSites);
    },
    newCustomerSite: async (req, res, next) => {           
        let d = new Date();
        let check_year = d.getFullYear();
        let check_month;
        check_month = d.getMonth() + 1;
        check_month = (check_month <= 9) ? "0" + check_month : check_month;
        let check_day;
        check_day = d.getDate();
        check_day = (check_day <= 9) ? "0" + check_day : check_day;
        let check_hours = "0" + d.getHours();
        let check_minutes = "0" + d.getMinutes();
        let check_seconds = "0" + d.getSeconds();
        let check_formattedTime = check_year + '-' + check_day + '-' + check_month;
        let check_formattedTime_ex = check_hours.substr(-2) + ':' + check_minutes.substr(-2) + ':' + check_seconds.substr(-2);
        
        let final = check_formattedTime + ' ' + check_formattedTime_ex;


        const newCustomerSite = new CustomerSite(req.value.body);           
        const customerSite = await newCustomerSite.save();

        let token = req.get('Authorization');
        
        verifyJWT(token).then(decodedToken => {
            
            req.user = decodedToken.data;
            let user_id = req.user.id;

            insertLog(user_id, 3, 'Nome: ' + req.value.body.description + ' - IP: ' + req.value.body.ip_address + ' - Porta: ' + req.value.body.port_number, customerSite._id);
        });       
        let newCustomerSiteLog = new CustomerSiteLog({
            'customer_site_id': customerSite._id,                
            'created_at': final,
            'state': 0
        });
      
        const customerSiteLog = await newCustomerSiteLog.save();    

        let newCustomerSiteLastLog = new CustomerSiteLastLog({
            'customer_site_id': customerSite._id,                
            'created_at': final,
            'state': 0
        });
      
        const customerSiteLastLog = await newCustomerSiteLastLog.save();   

       
        const users = await User.find({ role: { $gt: 0 }});
        let sites = [];
        await asyncForEach(users, async (element) => {
            let myObject = {
                user_id: element._id,
                customer_site_id: customerSite._id,
                notification: 0,
                telegram: 0,
                email: 0,
                sms: 0
            };
            sites.push(myObject);
        });        
        let newUserCustomerSites = await UserCustomerSite.insertMany(sites);
  
        res.status(201).json({
            'status': 201,
            'body': {
                'message': 'Sito registrato con successo.'
            }
        });   
    },
    deleteCustomer: async (req, res, next) => {
        const { customerId } = req.value.params;
        const customer_sites = await CustomerSite.find({ customer_id: customerId });
             
        if(customer_sites[0] != null) {
            res.status(200).json({ 
                'status': 200,
                'body': {
                    'success': false
                } 
            });
        }
        else {
            const customer = await Customer.findById(customerId);    
            const customer_ex = customer;        
            await customer.remove();

            let token = req.get('Authorization');
            
            verifyJWT(token).then(decodedToken => {
                req.user = decodedToken.data;
                let user_id = req.user.id;

                insertLog(user_id, 1, 'Nome: ' + customer_ex.name + ' - Codice: ' + customer_ex.customer_code, customer_ex._id);
                
                res.status(200).json({ 
                    'status': 200,
                    'body': {
                        'success': true
                    } 
                });
            });
        }        
    },
    deleteCustomerSite: async (req, res, next) => {
        const { siteId } = req.value.params;
   
        const customerSite = await CustomerSite.findById(siteId);    
        const customer_site_ex = customerSite;        
        await customerSite.remove();
   
        const userCustomerSites = await UserCustomerSite.find({customer_site_id: siteId}); 
      
        if(userCustomerSites[0] != null) {
            await asyncForEach(userCustomerSites, async (element) => {              
                await element.remove();
            });
        }

        let token = req.get('Authorization');
        
        verifyJWT(token).then(decodedToken => {
            req.user = decodedToken.data;
            let user_id = req.user.id;

            insertLog(user_id, 4, 'Nome: ' + customer_site_ex.description + ' - IP: ' + customer_site_ex.ip_address + ' - Porta: ' + customer_site_ex.port_number, siteId);

            res.status(200).json({ 
                'status': 200,
                'body': {
                    'success': true
                } 
            });
        });        
    },
    getAllSites: async (req, res, next) => {                  
        const customerSites = await CustomerSite.find({});
        let sites = [];
        await asyncForEach(customerSites, async (element) => {  
            const customer = await Customer.findById(element.customer_id);
            if(customer) {
                let siteObject = {
                    '_id': element._id,
                    'description': element.description,
                    'ip_address': element.ip_address,
                    'port_number': element.port_number,
                    'customer_name': customer.name
                };
                sites.push(siteObject);
            }            
        });
        res.status(200).json(sites.sort(predicate('customer_name')));
    },
    replaceCustomer: async (req, res, next) => {
        const { customerId } = req.value.params;
        const newCustomer = req.value.body;

        const result = await Customer.findByIdAndUpdate(customerId, newCustomer);

        let token = req.get('Authorization');
        
        verifyJWT(token).then(decodedToken => {
            req.user = decodedToken.data;
            let user_id = req.user.id;

            if(newCustomer.name != result.name)
                insertLog(user_id, 2, 'Campo: Ragione Sociale - Vecchio valore: ' + result.name + ' - Nuovo valore: ' + newCustomer.name, result._id);

            if(newCustomer.customer_code != result.customer_code)
                insertLog(user_id, 2, 'Campo: Codice Cliente - Vecchio valore: ' + result.customer_code + ' - Nuovo valore: ' + newCustomer.customer_code, result._id);
    
            if(newCustomer.referent_name != result.referent_name)
                insertLog(user_id, 2, 'Campo: Referente - Vecchio valore: ' + result.referent_name + ' - Nuovo valore: ' + newCustomer.referent_name, result._id);
    
            if(newCustomer.phone_number != result.phone_number)
                insertLog(user_id, 2, 'Campo: Telefono - Vecchio valore: ' + result.phone_number + ' - Nuovo valore: ' + newCustomer.phone_number, result._id);
    
            if(newCustomer.email != result.email)
                insertLog(user_id, 2, 'Campo: E-Mail - Vecchio valore: ' + result.email + ' - Nuovo valore: ' + newCustomer.email, result._id);

            if(newCustomer.logo != result.logo)
                insertLog(user_id, 2, 'Campo: Logo', result._id);

            res.status(200).json({ 
                'status': 200,
                'body': {
                    'success': true
                } 
            });
        });        
    },
    getCustomerSiteHosts: async (req, res, next) => {
        const { customerSiteId } = req.value.params;
        const host_groups = await HostGroup.find({ customer_site_id: customerSiteId });
        let results = [];
        const service_acks = await ServiceAck.find({ expired: 0 });
        await asyncForEach(host_groups, async (host_group) => {
            const hosts = await Host.find({ host_group_id: host_group._id });             
            await asyncForEach(hosts, async (element) => {
                const host_state = await HostLog.find({ host_id: element._id }).sort({ created_at: -1 }).limit(1);
                if(host_state) {      
                    let crit = host_state[0].host_num_services_crit;
                    let ok = host_state[0].host_num_services_ok;
                    let unknown = host_state[0].host_num_services_unknown;
                    let warn = host_state[0].host_num_services_warn;

                    //const service_acks = await ServiceAck.find({ host_id: element._id, expired: 0 });
                    await asyncForEach(service_acks, async (service_ack) => {        
                        if(JSON.stringify(service_ack.host_id) == JSON.stringify(host_state.host_id)) {
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
                        'acks': element.acks,
                        'groups': host_group.name
                    };    
                    results.push(hostObject);
                }
            });            
        });
        res.status(200).json(results);
    }
};