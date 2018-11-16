const express = require('express');
const router = require('express-promise-router')();

const verifyJWT_MW = require('../helpers/verifyJWT');
const UserCustomerSitesController = require('../controllers/user_customer_sites');

const { validateParam, validateBody, schemas } = require('../helpers/routeHelpers');

router.route('/:userCustomerSiteId')
    .patch(verifyJWT_MW, validateParam(schemas.idSchema, 'userCustomerSiteId'), validateBody(schemas.patchUserCustomerSiteSchema), UserCustomerSitesController.replaceUserCustomerSite);

module.exports = router;