const CustomerSiteLastLog = require('../models/customer_site_last_log');

module.exports = {
    getCustomerSiteState: async (req, res, next) => {          
        const { siteId } = req.value.params;
        const last_log = await CustomerSiteLastLog.findOne({ customer_site_id: siteId });
        res.status(200).json(last_log.state);      
    }
};