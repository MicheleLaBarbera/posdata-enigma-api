const CustomerSiteLastLog = require('../models/customer_site_last_log');
const CustomerSite = require('../models/customer_site');

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
};