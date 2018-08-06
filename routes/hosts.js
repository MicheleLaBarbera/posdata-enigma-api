const express = require('express');
const router = require('express-promise-router')();

const verifyJWT_MW = require('../helpers/verifyJWT');
const HostsController = require('../controllers/hosts');

const { validateParam, validateBody, schemas } = require('../helpers/routeHelpers');

router.route('/:hostGroupId/')
    .get(verifyJWT_MW, validateParam(schemas.idSchema, 'hostGroupId'), HostsController.getHostgroupHosts)
    /*.post(verifyJWT_MW, validateBody(schemas.customerSchema), CustomersController.newCustomer);

router.route('/:customerId/sites/')
    .get(verifyJWT_MW, validateParam(schemas.idSchema, 'customerId'), CustomersController.getCustomerSites)
    .post(verifyJWT_MW, validateParam(schemas.idSchema, 'customerId'), validateBody(schemas.customerSiteSchema), CustomersController.newCustomerSite);
*/
module.exports = router;