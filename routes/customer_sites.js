const express = require('express');
const router = require('express-promise-router')();

const verifyJWT_MW = require('../helpers/verifyJWT');
const CustomerSitesController = require('../controllers/customer_sites');

const { validateParam, validateBody, schemas } = require('../helpers/routeHelpers');

router.route('/:siteId/state')
    .get(verifyJWT_MW, validateParam(schemas.idSchema, 'siteId'), CustomerSitesController.getCustomerSiteState);

router.route('/:siteId')
    .patch(verifyJWT_MW, validateParam(schemas.idSchema, 'siteId'), validateBody(schemas.patchCustomerSiteSchema), CustomerSitesController.replaceCustomerSite)

router.route('/:siteId/services/state/:stateId')
    .get(verifyJWT_MW, validateParam(schemas.idSchema, 'siteId'), validateParam(schemas.stateIdSchema, 'stateId'), CustomerSitesController.getCustomerSiteServicesByState)

router.route('/:siteId/hosts/state/:stateId')
    .get(verifyJWT_MW, validateParam(schemas.idSchema, 'siteId'), validateParam(schemas.stateIdSchema, 'stateId'), CustomerSitesController.getCustomerSiteHostsByState)

module.exports = router;