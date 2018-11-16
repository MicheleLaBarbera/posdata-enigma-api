const UserCustomerSite = require('../models/user_customer_site');
const ObjectId = require('mongoose').Types.ObjectId;


module.exports = {    
    replaceUserCustomerSite: async (req, res, next) => {
        const { userCustomerSiteId } = req.value.params;
        const newUserCustomerSite = req.value.body;

        const result = await UserCustomerSite.findByIdAndUpdate(userCustomerSiteId, newUserCustomerSite);

        res.status(200).json({ 
            'status': 200,
            'body': {
                'success': true
            } 
        });
    },
};