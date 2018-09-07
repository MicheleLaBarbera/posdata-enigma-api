const Customer = require('../models/customer');
const CustomerSite = require('../models/customer_site');
const UserLog = require('../models/user_log');
const User = require('../models/user');
const UserCustomerSite = require('../models/user_customer_site');
const CustomerSiteLog = require('../models/customer_site_log');
const ObjectId = require('mongoose').Types.ObjectId;
let { verifyJWT } = require('../helpers/auth');

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}

module.exports = {
    index: async (req, res, next) => {          
        const customers = await Customer.find({});
        res.status(200).json(customers);      
    },
    newCustomer: async (req, res, next) => {   
        const newCustomer = new Customer(req.value.body);           
        const customer = await newCustomer.save();

        let token = req.get('Authorization');
        
        verifyJWT(token).then(decodedToken => {
            req.user = decodedToken.data;

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
                'user_id': req.user.id,
                'action_type': 0,
                'message': 'Creazione cliente | Nome: ' + customer.name + ' - Codice Cliente: ' + customer.customer_code,
                'created_at': final
            });
            
            const userLog = newUserLog.save();
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
            
            let newUserLog = new UserLog({
                'user_id': req.user.id,
                'action_type': 1,
                'message': 'Creazione sito | Nome: ' + req.value.body.description + ' - IP: ' + req.value.body.ip_address + ' - Porta: ' + req.value.body.port_number,
                'created_at': final
            });
            const userLog = newUserLog.save();

        });       
        let newCustomerSiteLog = new CustomerSiteLog({
            'customer_site_id': customerSite._id,                
            'created_at': final,
            'state': 0
        });
      
        const customerSiteLog = await newCustomerSiteLog.save();    
       
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
                    'user_id': req.user.id,
                    'action_type': 2,
                    'message': 'Eliminazione cliente | Nome: ' + customer_ex.name + ' - Indirizzo: ' + customer_ex.address + ' - Partita IVA: ' + customer_ex.vat_number,
                    'created_at': final
                });
    
                const userLog = newUserLog.save();
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
                'user_id': req.user.id,
                'action_type': 3,
                'message': 'Eliminazione sito | Nome: ' + customer_site_ex.description + ' - IP: ' + customer_site_ex.ip_address + ' - Porta: ' + customer_site_ex.port_number,
                'created_at': final
            });

            const userLog = newUserLog.save();
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
        res.status(200).json(sites);
    },
    replaceCustomer: async (req, res, next) => {
        const { customerId } = req.value.params;
        const newCustomer = req.value.body;

        const result = await Customer.findByIdAndUpdate(customerId, newCustomer);
    
        res.status(200).json({ 
            'status': 200,
            'body': {
                'success': true
            } 
        });
    }
};