const Customer = require('../models/customer');
const CustomerSite = require('../models/customer_site');
const ObjectId = require('mongoose').Types.ObjectId;

module.exports = {
    index: async (req, res, next) => {          
        const customers = await Customer.find({});
        res.status(200).json(customers);      
    },
    newCustomer: async (req, res, next) => {
        const newCustomer = new Customer(req.value.body);           
        const customer = await newCustomer.save();
        res.status(201).json({
            'status': 201,
            'body': {
                'message': 'Cliente registrato con successo.'
            }
        });   
    },
    getCustomerSites: async (req, res, next) => {
        const { customerId } = req.value.params;
        const customerSites = await CustomerSite.find({ customer_id: customerId});
        res.status(200).json(customerSites);
    },
    newCustomerSite: async (req, res, next) => {   
        const newCustomerSite = new CustomerSite(req.body);           
        const customerSite = await newCustomerSite.save();
        res.status(201).json({
            'status': 201,
            'body': {
                'message': 'Sito registrato con successo.'
            }
        });   
    }
};