const express = require('express');
const router = require('express-promise-router')();

const verifyJWT_MW = require('../helpers/verifyJWT');
const CustomersController = require('../controllers/customers');

const { validateParam, validateBody, schemas } = require('../helpers/routeHelpers');

router.route('/')
    .get(verifyJWT_MW, CustomersController.index)
    .post(verifyJWT_MW, validateBody(schemas.customerSchema), CustomersController.newCustomer);

router.route('/:customerId/sites/')
    .get(verifyJWT_MW, validateParam(schemas.idSchema, 'customerId'), CustomersController.getCustomerSites)
    .post(verifyJWT_MW, validateParam(schemas.idSchema, 'customerId'), validateBody(schemas.customerSiteSchema), CustomersController.newCustomerSite);

router.route('/:customerSiteId/hosts/')
    .get(verifyJWT_MW, validateParam(schemas.idSchema, 'customerSiteId'), CustomersController.getCustomerSiteHosts)

router.route('/:customerId/sites/:siteId')
    .delete(verifyJWT_MW, validateParam(schemas.idSchema, 'siteId'), CustomersController.deleteCustomerSite);

router.route('/:customerId')
    .patch(verifyJWT_MW, validateParam(schemas.idSchema, 'customerId'), validateBody(schemas.patchCustomerSchema), CustomersController.replaceCustomer)
    .delete(verifyJWT_MW, validateParam(schemas.idSchema, 'customerId'), CustomersController.deleteCustomer);

router.route('/sites')
    .get(verifyJWT_MW, CustomersController.getAllSites);
    


module.exports = router;