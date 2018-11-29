const User = require('../models/user');
const CustomerUser = require('../models/customer_user');
const Customer = require('../models/customer');
const UserCustomerSite = require('../models/user_customer_site');
const CustomerSite = require('../models/customer_site');
const HostGroup = require('../models/host_group');
const ServiceLastLog = require('../models/service_last_log');
const ServiceAck = require('../models/service_ack');
const Service = require('../models/service');
const CustomerSiteLastLog = require('../models/customer_site_last_log');

const { CreateJWToken } = require('../helpers/auth');
const nodemailer = require('nodemailer');
const crypto = require("crypto");

const bcrypt = require('bcrypt');
const saltRounds = 10;

const mongoose = require('mongoose');

const UserLog = require('../models/user_log');
let { verifyJWT } = require('../helpers/auth');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'pos.scheduler.email@gmail.com',
        pass: 'scheduler99'
    }
});

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}

module.exports = {
    index: async (req, res, next) => {          
        const users = await User.find().where('deleted').ne(1);
        await asyncForEach(users, async (element) => {
            const customerUser = await CustomerUser.findOne( { user_id: element._id } );
            if(customerUser) {
                const customer = await Customer.findById(customerUser.customer_id);
                if(customer) {
                    element.customer_name = customer.name;
                    element.customer_id = customer._id;
                }
                else {
                    element.customer_name = 'undefined';
                    element.customer_id = 'undefined';
                }
            }
            else {
                element.customer_name = 'undefined';
                element.customer_id = 'undefined';
            }
        });          
        res.status(200).json(users.sort(predicate('customer_name', 'firstname', 'lastname', 'username')));      
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
                const user_site = await UserCustomerSite.insertMany(sites);
            }
        }

        res.status(201).json({
            'status': 201,
            'body': {
                'message': 'Utente registrato con successo.'
            }        
        });   
    },
    replaceUser: async (req, res, next) => {
        const { userId } = req.value.params;
        const newUser = req.value.body;

        const result = await User.findByIdAndUpdate(userId, newUser);
    
        res.status(200).json({ 
            'status': 200,
            'body': {
                'success': true
            } 
        });
    },
    deleteUser: async (req, res, next) => {
        const { userId } = req.value.params;

        const user = await User.findById(userId);   
        if(user) {
            user.username = '@deleted@' + user.username;
            user.deleted = 1;
            await user.save();


            res.status(200).json({ 
                'status': 200,
                'body': {
                    'success': true
                } 
            });   
        }        
    },
    replaceUserProfile: async (req, res, next) => {
        const { userId } = req.value.params;
        const newUser = req.value.body;

        const result = await User.findByIdAndUpdate(userId, newUser);

        let age = 604800;

        const token = CreateJWToken({
            sessionData: {
                'firstname': result.firstname,
                'lastname': result.lastname,
                'role': result.role,
                'email': result.email,                        
                'id': result._id,
                'telegram_id': result.telegram_id,
                'phone_number': result.phone_number,
                'office_number': result.office_number
            },
            maxAge: age
        });

        res.status(200).json({
            'status': 200,
            'body': {
                'token': token                    
            }
        });        
    },
    changePasswordProfile: async (req, res, next) => {
        const { userId } = req.value.params;

        const user = await User.findById(userId);

        if(user && !user.deleted) {
            const match = await bcrypt.compare(req.value.body.current_password, user.password);
    
            if(match) {
                user.password = await bcrypt.hash(req.value.body.confirm_password, saltRounds);                    
                const user_saved = await user.save();

                res.status(200).json({ 
                    'status': 200,
                    'body': {
                        'success': true
                    } 
                });
            }
            else {
                res.status(201).json("")
            }
        }
    },
    updatePassword: async (req, res, next) => {
        const { token } = req.value.params;
        let user = await User.findOne({ reset_password_token: token });
        if(!user) {
           res.status(201).json("Token inesistente.");
        }
        else {
            user.password = await bcrypt.hash(req.value.body.confirm_password, saltRounds); 
            user.reset_password_token = '';
            user.reset_password_expires = '';   
            const user_saved = await user.save();

            res.status(200).json({ 
                'status': 200,
                'body': {
                    'success': true
                } 
            });        
        }
    },
    auth: async (req, res, next) => {    
        const user = await User.findOne( { username: req.value.body.username } );
        if(user && !user.deleted) {
            const match = await bcrypt.compare(req.value.body.password, user.password);
    
            if(match) {
                let age = (req.value.body.remember) ? 604800 : 1800;

                const token = CreateJWToken({
                    sessionData: {
                        'firstname': user.firstname,
                        'lastname': user.lastname,
                        'role': user.role,
                        'email': user.email,                        
                        'id': user._id,
                        'telegram_id': user.telegram_id,
                        'phone_number': user.phone_number,
                        'office_number': user.office_number
                    },
                    maxAge: age
                });

                const customerUser = await CustomerUser.findOne( { user_id: user._id } );   
                if(customerUser) {
                    const customer = await Customer.findById(customerUser.customer_id);   
            
                    insertLog(user._id, 11, (req.value.body.remember) ? 'Ricordami: Attivato' : 'Ricordami: Disattivato', user._id);

                    res.status(200).json({
                        'status': 200,
                        'body': {
                            'token': token,
                            'logo': customer.logo,
                            'customer_name': customer.name
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
        const userCustomerSites = await UserCustomerSite.find({ user_id: userId });

        const user = await User.findById(userId);

        if(!userCustomerSites.length)
            return res.status(404).json({
                        'status': 404,
                        'body': {
                            'message': "All'utente " + user.firstname + " " + user.lastname + " non è associato nessun sito. Si prega di contattare l'amministratore."
                        }
                    });
  
        let sites = [];
        await asyncForEach(userCustomerSites, async (element) => {
            const customerSite = await CustomerSite.findById(element.customer_site_id);
            if(!customerSite)       
                return res.status(404).json({
                            'status': 404,
                            'body': {
                                'message': "Mancata integrità nel Database. Il sito '" + element.customer_site_id + "' non esiste."
                            }
                        });

            const customer = await Customer.findById(customerSite.customer_id);
            if(!customer) 
                return res.status(404).json({
                            'status': 404,
                            'body': {
                                'message': "Mancata integrità nel Database. L'azienda '" + customerSite.customer_id + "' non esiste."
                            }
                        });

            const hostGroups = await HostGroup.aggregate([ { $sort: { alias: 1 } }, { $match: { customer_site_id: customerSite._id } } ]);

            const customerSiteNumber = await CustomerSite.find({ customer_id: customerSite.customer_id });

            let description = '';
            if(customerSiteNumber.length > 1)
                description = customerSite.description;
            
            let customerSiteObject = {                
                '_id': customerSite._id,
                'name': customer.name,
                'ip': customerSite.ip_address,
                'port': customerSite.port_number,
                'description': description,          
                'hosts_down': 0,
                'hosts_pending': 0,
                'hosts_unreachable': 0,
                'hosts_up': 0,
                'services_crit': 0,
                'services_ok': 0,
                'services_ack': 0,
                'services_unknown': 0,
                'services_warn': 0,                   
                'groups': hostGroups,
                'check_state': 0              
            }
            hostGroups.forEach(element => {
                customerSiteObject.hosts_down += element.num_hosts_down;
                customerSiteObject.hosts_pending += element.num_hosts_pending;
                customerSiteObject.hosts_unreachable += element.num_hosts_unreach;
                customerSiteObject.hosts_up += element.num_hosts_up;    
                element.worst_service_state = 0;             
                
                let toArray =  element.alias.split("-");
                element.alias = toArray[1];                    
            });

            const last_log = await CustomerSiteLastLog.findOne({ customer_site_id: element.customer_site_id });
            if(last_log)
                customerSiteObject.check_state = last_log.state;

            const services = await ServiceLastLog.find({ customer_site_id: element.customer_site_id });                
            
            await asyncForEach(services, async (element) => {
                switch(element.service_state) {
                    case 0: {
                        customerSiteObject.services_ok++;                       
                        break;
                    }
                    case 1: {
                        let service = await Service.findById(element.service_id);
                        if(service) {
                            if(service.visible) {
                                let service_ack = await ServiceAck.find({ service_id: element.service_id, expired: 0 }).sort({ created_at: -1 }).limit(1);
                                if(service_ack[0] != null) {
                                    customerSiteObject.services_ack++;
                                    
                                    hostGroups.forEach(group => {                            
                                        if(group._id.toString() == element.host_group_id.toString()) {     
                                            if(group.worst_service_state == 0)                           
                                                group.worst_service_state = 4;                                        
                                        }
                                    });    
                                }
                                else {
                                    customerSiteObject.services_warn++;

                                    hostGroups.forEach(group => {                            
                                        if(group._id.toString() == element.host_group_id.toString()) {     
                                            if(group.worst_service_state == 0 || group.worst_service_state == 3 || group.worst_service_state == 4)                       
                                                group.worst_service_state = 1;                                        
                                        }
                                    });
                                }     
                            }       
                        }       
                        break;
                    }
                    case 2: {
                        let service = await Service.findById(element.service_id);
                        if(service) {
                            if(service.visible) {
                                let service_ack = await ServiceAck.find({ service_id: element.service_id, expired: 0 }).sort({ created_at: -1 }).limit(1);
                                if(service_ack[0] != null) {
                                    customerSiteObject.services_ack++;

                                    hostGroups.forEach(group => {                            
                                        if(group._id.toString() == element.host_group_id.toString()) {     
                                            if(group.worst_service_state == 0)                           
                                                group.worst_service_state = 4;                                        
                                        }
                                    });                              
                                }
                                else {
                                    customerSiteObject.services_crit++;

                                    hostGroups.forEach(group => {                             
                                        if(group._id.toString() == element.host_group_id.toString()) {     
                                            if(group.worst_service_state == 0 || group.worst_service_state == 1 || group.worst_service_state == 3 || group.worst_service_state == 4) {                          
                                                group.worst_service_state = 2;        
                                            }                                
                                        }
                                    });
                                }         
                            }
                        }            
                        break;
                    }
                    case 3: {
                        let service = await Service.findById(element.service_id);
                        if(service) {
                            if(service.visible) {
                                let service_ack = await ServiceAck.find({ service_id: element.service_id, expired: 0 }).sort({ created_at: -1 }).limit(1);
                                if(service_ack[0] != null) {
                                    customerSiteObject.services_ack++;

                                    hostGroups.forEach(group => {                            
                                        if(group._id.toString() == element.host_group_id.toString()) {     
                                            if(group.worst_service_state == 0)                           
                                                group.worst_service_state = 4;                                        
                                        }
                                    });                         
                                }
                                else {
                                    customerSiteObject.services_unknown++;

                                    hostGroups.forEach(group => {                   
                                        if(group._id.toString() == element.host_group_id.toString()) {   
                                            if(group.worst_service_state == 0 || group.worst_service_state == 4)                          
                                                group.worst_service_state = 3;                                        
                                        }
                                    });
                                }  
                            }
                        }               
                        break;
                    }
                }
            });
            sites.push(customerSiteObject);    
             
        });
        res.status(200).json(sites.sort(predicate('name')));  
    },
    getUserCustomerSiteHostgroups: async (req, res, next) => {
        const userId = req.value.params.userId;
        const siteId = req.value.params.siteId;

        const userCustomerSite = await UserCustomerSite.findOne({ user_id: userId, customer_site_id: siteId});
        if(!userCustomerSite) 
            return res.status(403).json({
                        'status': 403,
                        'body': {
                            'message': "Non hai i permessi per visualizzare questa pagina."
                        }
                    });

        const customerSite = await CustomerSite.findById(siteId);
        if(!customerSite)       
            return res.status(404).json({
                        'status': 404,
                        'body': {
                            'message': "Mancata integrità nel Database. Il sito '" + element.customer_site_id + "' non esiste."
                        }
                    });

        const customer = await Customer.findById(customerSite.customer_id);
        if(!customer) 
            return res.status(404).json({
                        'status': 404,
                        'body': {
                            'message': "Mancata integrità nel Database. L'azienda '" + customerSite.customer_id + "' non esiste."
                        }
                    });

        const customerSiteNumber = await CustomerSite.find({ customer_id: customerSite.customer_id });

        let description = '';
        if(customerSiteNumber.length > 1)
            description = customerSite.description;

        const hostGroups = await HostGroup.aggregate([ { $sort: { alias: 1 } }, { $match: { customer_site_id: customerSite._id } } ]);
        let customerSiteObject = {                
            '_id': customerSite._id,
            'name': customer.name,
            'ip': customerSite.ip_address,
            'port': customerSite.port_number,
            'description': description,          
            'hosts_down': 0,
            'hosts_pending': 0,
            'hosts_unreachable': 0,
            'hosts_up': 0,
            'services_crit': 0,
            'services_ok': 0,
            'services_ack': 0,
            'services_unknown': 0,
            'services_warn': 0,                   
            'groups': hostGroups,
            'check_state': 0,
            'referent_name': customer.referent_name,
            'referent_mail': customer.email,
            'referent_phone': customer.phone_number,     
            'notification': userCustomerSite.notification,
            'user_customer_site_id': userCustomerSite._id
        }
        hostGroups.forEach(element => {
            customerSiteObject.hosts_down += element.num_hosts_down;
            customerSiteObject.hosts_pending += element.num_hosts_pending;
            customerSiteObject.hosts_unreachable += element.num_hosts_unreach;
            customerSiteObject.hosts_up += element.num_hosts_up;     
            element.worst_service_state = 0; 

            let toArray =  element.alias.split("-");
            element.alias = toArray[1];                
        });      

        const last_log = await CustomerSiteLastLog.findOne({ customer_site_id: siteId });
        customerSiteObject.check_state = last_log.state;
        
        const services = await ServiceLastLog.find({ customer_site_id: siteId });                
        
        await asyncForEach(services, async (element) => {
            switch(element.service_state) {
                case 0: {
                    customerSiteObject.services_ok++;                       
                    break;
                }
                case 1: {
                    let service = await Service.findById(element.service_id);                            
                    if(service) {
                        if(service.visible) {
                            let service_ack = await ServiceAck.find({ service_id: element.service_id, expired: 0 }).sort({ created_at: -1 }).limit(1);                          
                            if(service_ack[0] != null) {                         
                                customerSiteObject.services_ack++;

                                hostGroups.forEach(group => {                            
                                    if(group._id.toString() == element.host_group_id.toString()) {     
                                        if(group.worst_service_state == 0)                           
                                            group.worst_service_state = 4;                                        
                                    }
                                });                  
                            }
                            else {
                                customerSiteObject.services_warn++;

                                hostGroups.forEach(group => {                            
                                    if(group._id.toString() == element.host_group_id.toString()) {     
                                        if(group.worst_service_state == 0 || group.worst_service_state == 3 || group.worst_service_state == 4)                           
                                            group.worst_service_state = 1;                                        
                                    }
                                });
                            }     
                        }       
                    }       
                    break;
                }
                case 2: {
                    let service = await Service.findById(element.service_id);                
                    if(service) {
                        if(service.visible) {
                            let service_ack = await ServiceAck.find({ service_id: element.service_id, expired: 0 }).sort({ created_at: -1 }).limit(1);
                            if(service_ack[0] != null) {                                    
                                customerSiteObject.services_ack++;
          
                                hostGroups.forEach(group => {                            
                                    if(group._id.toString() == element.host_group_id.toString()) {     
                                        if(group.worst_service_state == 0)                           
                                            group.worst_service_state = 4;                                        
                                    }
                                });                                
                            }
                            else {
                                customerSiteObject.services_crit++;

                                hostGroups.forEach(group => {                             
                                    if(group._id.toString() == element.host_group_id.toString()) {     
                                        if(group.worst_service_state == 0 || group.worst_service_state == 1 || group.worst_service_state == 3 || group.worst_service_state == 4) {                          
                                            group.worst_service_state = 2;        
                                        }                                
                                    }
                                });
                            }         
                        }
                    }            
                    break;
                }
                case 3: {
                    let service = await Service.findById(element.service_id);
                    if(service) {
                        if(service.visible) {
                            let service_ack = await ServiceAck.find({ service_id: element.service_id, expired: 0 }).sort({ created_at: -1 }).limit(1);
                            if(service_ack[0] != null) {
                                customerSiteObject.services_ack++;
    
                                hostGroups.forEach(group => {                            
                                    if(group._id.toString() == element.host_group_id.toString()) {     
                                        if(group.worst_service_state == 0)                           
                                            group.worst_service_state = 4;                                        
                                    }
                                });
                            }
                            else {
                                customerSiteObject.services_unknown++;

                                hostGroups.forEach(group => {                   
                                    if(group._id.toString() == element.host_group_id.toString()) {   
                                        if(group.worst_service_state == 0 || group.worst_service_state == 4)                          
                                            group.worst_service_state = 3;                                        
                                    }
                                });
                            }  
                        }
                    }               
                    break;
                }
            }
        });
        res.status(200).json(customerSiteObject);        
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
        res.status(200).json(sites.sort(predicate('customer_name')));        
    },
    newUserSite: async (req, res, next) => {   
        const checkSite = await UserCustomerSite.findOne({user_id: req.value.body.user_id, customer_site_id: req.value.body.customer_site_id});

        if(!checkSite) {
        
            let newObject = {
                "_id": mongoose.Types.ObjectId(),
                "user_id": req.value.body.user_id,
                "customer_site_id": req.value.body.customer_site_id,
                "notification": req.value.body.notification,
                "telegram": req.value.body.telegram,
                "email": req.value.body.email,
                "sms": req.value.body.sms,
            }
 
            const newUserSite = new UserCustomerSite(newObject);           
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
    },
    forgotPassword: async (req, res, next) => {
        const { userId } = req.value.params;
        const user = await User.findById(userId);

        if(user) {
            if(user.email) {
                let newPassword = crypto.randomBytes(5).toString('hex');
                
                const mailOptions = {
                    from: 'pos.scheduler.email@gmail.com', 
                    to: user.email,
                    subject: 'Enigma - Password dimenticata',
                    html: '<p>Nuova password: <b>' + newPassword + '</b></p>'
                };

                transporter.sendMail(mailOptions, async (err, info) => {
                    if(err) {
                        res.status(403).json({
                            'status': 403,
                            'body': {
                                'message': err
                            }
                        }); 
                    }
                    else {
                        let newHashPassword = await bcrypt.hash(newPassword, saltRounds);
                        let update = await User.update({ _id: userId }, { password: newHashPassword });

                        if(update) {
                            res.status(200).json({
                                'status': 200,
                                'body': {
                                    'message': "E-Mail inviata con successo."
                                }
                            });   
                        }                  
                    }
                });
            }
        }
    },
    recoverPassword: async (req, res, next) => {       
        let token = crypto.randomBytes(20).toString('hex');
        let user = await User.findOne({ email: req.value.body.email });

        if(!user) {
           res.status(404).json("Indirizzo email inesistente.");
        }
        else {
            user.reset_password_token = token;
            user.reset_password_expires = Date.now() + 3600000; 

            let save_result = await user.save();
    
            const mailOptions = {
                from: 'pos.scheduler.email@gmail.com', 
                to: user.email,
                subject: 'Enigma - Richiesta ripristino password',
                html: '<p>La tua password può essere ripristinata cliccando il link qui sotto:</p>' + 
                      "<a href='http://enigma.posdata.it:8085/reset/" + token + "'>Ripristina Password</a>" +
                      '<p>Se non hai richiesto una nuova password, puoi ignorare questa email.</p>'                     
            };

            transporter.sendMail(mailOptions, async (err, info) => {
                if(err) {
                    res.status(403).json({
                        'status': 403,
                        'body': {
                            'message': err
                        }
                    }); 
                }
                else {
                    res.status(200).json({
                        'status': 200,
                        'body': {
                            'message': "E-Mail inviata con successo."
                        }
                    });                                     
                }
            });
        }
    },
    checkRecoverToken: async (req, res, next) => {
        const { token } = req.value.params;
        let user = await User.findOne({ reset_password_token: token });
        if(!user) {
           res.status(201).json("Token inesistente.");
        }
        else {
            res.status(200).json({
                'status': 200,
                'body': {
                    'message': "Token valido."
                }
            });
        }
    },
    deleteUserCustomerSite: async (req, res, next) => {
        const { userId, siteId } = req.value.params;
   
        const userCustomerSite = await UserCustomerSite.findOne({user_id: userId, customer_site_id: siteId});    
        await userCustomerSite.remove();   

        res.status(200).json({ 
            'status': 200,
            'body': {
                'success': true
            } 
        });       
    },
};


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