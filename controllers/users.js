const User = require('../models/user');
const CustomerUser = require('../models/customer_user');
const Customer = require('../models/customer');
const UserCustomerSite = require('../models/user_customer_site');
const CustomerSite = require('../models/customer_site');
const HostGroup = require('../models/host_group');

const { CreateJWToken } = require('../helpers/auth');

const bcrypt = require('bcrypt');
const saltRounds = 10;

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

module.exports = {
    index: async (req, res, next) => {          
        const users = await User.find({});
        await asyncForEach(users, async (element) => {
            const customerUser = await CustomerUser.findOne( { user_id: element._id } );
            if(customerUser) {
                const customer = await Customer.findById(customerUser.customer_id);
                if(customer) {
                    element.customer_name = customer.name;
                }
                else {
                    element.customer_name = 'undefined';
                }
            }
            else {
                element.customer_name = 'undefined';
            }
        });          
        res.status(200).json(users);      
    },
    newUser: async (req, res, next) => {
        const newUser = new User(req.value.body);        
        newUser.password = await bcrypt.hash(newUser.password, saltRounds);    
        const user = await newUser.save();
        const newCustomerUser = new CustomerUser({
            customer_id: req.value.body.customer_id,
            user_id: user._id
        });
        const customerUser = await newCustomerUser.save();
        if(req.value.body.role != 0) {
            let sites = [];
            const customerSites = await CustomerSite.find({});
            await asyncForEach(customerSites, async (element) => {
                let customerSiteObject = {
                    'user_id': user._id,
                    'customer_site_id': element._id,
                    'notification': 0,
                    'telegram': 0,
                    'email': 0,
                    'sms': 0
                }
                sites.push(customerSiteObject);
            });
            if(sites) {
                //console.log(sites);                 
                const user_site = await UserCustomerSite.insertMany(sites);
                //console.log(user_site);  
            }
        }

        res.status(201).json({
            'status': 201,
            'body': {
                'message': 'Utente registrato con successo.'
            }        
        });   
    },
    auth: async (req, res, next) => {    
        const user = await User.findOne( { username: req.value.body.username } );
        if(user) {
            const match = await bcrypt.compare(req.value.body.password, user.password);
    
            if(match) {
                const token = CreateJWToken({
                    sessionData: {
                        'firstname': user.firstname,
                        'lastname': user.lastname,
                        'role': user.role,
                        'id': user._id
                    },
                    maxAge: 360000000
                });

                const customerUser = await CustomerUser.findOne( { user_id: user._id } );   
                if(customerUser) {
                    const customer = await Customer.findById(customerUser.customer_id);   
            
                    res.status(200).json({
                        'status': 200,
                        'body': {
                            'token': token,
                            'logo': customer.logo
                        }
                    });       
                }
                else {
                    res.status(201).json("")
                }
            }
            else {
                res.status(201).json("")
            }
        }
        else {
            res.status(201).json("")
        }
    },
    getUserCustomerSitesHostgroups: async (req, res, next) => {
        const { userId } = req.value.params;
        const userCustomerSites = await UserCustomerSite.find({ user_id: userId});
        var sites = [];
        await asyncForEach(userCustomerSites, async (element) => {
            const customerSite = await CustomerSite.findById(element.customer_site_id);
            if(customerSite) {
                const customer = await Customer.findById(customerSite.customer_id);
                const hostGroups = await HostGroup.aggregate([ { $sort: { alias: 1 } }, { $match: { customer_site_id: customerSite._id } } ]);
                var customerSiteObject = {                
                    '_id': customerSite._id,
                    'name': customer.name,
                    'ip': customerSite.ip_address,
                    'port': customerSite.port_number,
                    'description': customerSite.description,          
                    'hosts_down': 0,
                    'hosts_pending': 0,
                    'hosts_unreachable': 0,
                    'hosts_up': 0,
                    'services_crit': 0,
                    'services_ok': 0,
                    'services_pending': 0,
                    'services_unknown': 0,
                    'services_warn': 0,                   
                    'groups': hostGroups                
                }
                hostGroups.forEach(element => {
                    customerSiteObject.hosts_down += element.num_hosts_down;
                    customerSiteObject.hosts_pending += element.num_hosts_pending;
                    customerSiteObject.hosts_unreachable += element.num_hosts_unreach;
                    customerSiteObject.hosts_up += element.num_hosts_up;
                    customerSiteObject.services_crit += element.num_services_crit;
                    customerSiteObject.services_ok += element.num_services_ok;
                    customerSiteObject.services_pending += element.num_services_pending;
                    customerSiteObject.services_unknown += element.num_services_unknown;
                    customerSiteObject.services_warn += element.num_services_warn;
                    
                    var toArray =  element.alias.split("-");
                    element.alias = toArray[1];
                    
                });        
                sites.push(customerSiteObject);    
            }       
        });
        res.status(200).json(sortByKey(sites, 'name'));  
    },
    getUserCustomerSiteHostgroups: async (req, res, next) => {
        const userId = req.value.params.userId;
        const siteId = req.value.params.siteId;

        const userCustomerSite = await UserCustomerSite.find({ user_id: userId, customer_site_id: siteId});
        if(userCustomerSite.length == 0) {
            res.status(403).json({
                'status': 403,
                'body': {
                    'message': 'Non hai i permessi per visualizzare questa pagina.'
                }
            });
        } else {
            const customerSite = await CustomerSite.findById(siteId);
            if(customerSite) {
                const customer = await Customer.findById(customerSite.customer_id);
                const hostGroups = await HostGroup.aggregate([ { $sort: { alias: 1 } }, { $match: { customer_site_id: customerSite._id } } ]);
                var customerSiteObject = {                
                    '_id': customerSite._id,
                    'name': customer.name,
                    'ip': customerSite.ip_address,
                    'port': customerSite.port_number,
                    'description': customerSite.description,          
                    'hosts_down': 0,
                    'hosts_pending': 0,
                    'hosts_unreachable': 0,
                    'hosts_up': 0,
                    'services_crit': 0,
                    'services_ok': 0,
                    'services_pending': 0,
                    'services_unknown': 0,
                    'services_warn': 0,                   
                    'groups': hostGroups                
                }
                hostGroups.forEach(element => {
                    customerSiteObject.hosts_down += element.num_hosts_down;
                    customerSiteObject.hosts_pending += element.num_hosts_pending;
                    customerSiteObject.hosts_unreachable += element.num_hosts_unreach;
                    customerSiteObject.hosts_up += element.num_hosts_up;
                    customerSiteObject.services_crit += element.num_services_crit;
                    customerSiteObject.services_ok += element.num_services_ok;
                    customerSiteObject.services_pending += element.num_services_pending;
                    customerSiteObject.services_unknown += element.num_services_unknown;
                    customerSiteObject.services_warn += element.num_services_warn;
                    
                    var toArray =  element.alias.split("-");
                    element.alias = toArray[1];                
                });     
                res.status(200).json(customerSiteObject); 
            }    
        }
    },
    getUserSites: async (req, res, next) => {
        const { userId } = req.value.params;
        const userCustomerSites = await UserCustomerSite.find({ user_id: userId });

        var sites = [];
        await asyncForEach(userCustomerSites, async (element) => {
            const customerSite = await CustomerSite.findById(element.customer_site_id);
            if(customerSite) {
                const customer = await Customer.findById(customerSite.customer_id);
                if(customer) {
                    let siteObject = {
                        '_id': customerSite._id,
                        'description': customerSite.description,
                        'ip_address': customerSite.ip_address,
                        'port_number': customerSite.port_number,
                        'customer_name': customer.name
                    };
                    sites.push(siteObject);
                }
            }
        });
        res.status(200).json(sites);
    },
    newUserSite: async (req, res, next) => {   
        const checkSite = await UserCustomerSite.findOne({user_id: req.value.body.user_id, customer_site_id: req.value.body.customer_site_id});
        console.log(checkSite)

        if(!checkSite) {
        
            const newUserSite = new UserCustomerSite(req.value.body);           
            const user_site = await newUserSite.save();
        
            res.status(201).json({
                'status': 201,
                'body': {
                    'message': 'Sito collegato con successo.'
                }
            }); 
        } 
        else {
            res.status(200).json({
                'status': 200,
                'body': {
                    'message': "Il sito selezionato è già collegato all'utente."
                }
            }); 
        }           
    }
};
