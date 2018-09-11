const express = require('express');
const router = require('express-promise-router')();

const verifyJWT_MW = require('../helpers/verifyJWT');
const ServicesController = require('../controllers/services');

const { validateParam, validateBody, schemas } = require('../helpers/routeHelpers');

router.route('/:hostId/')
    .get(verifyJWT_MW, validateParam(schemas.idSchema, 'hostId'), ServicesController.getHostServices)
    /*.post(verifyJWT_MW, validateBody(schemas.customerSchema), CustomersController.newCustomer);

router.route('/:customerId/sites/')
    .get(verifyJWT_MW, validateParam(schemas.idSchema, 'customerId'), CustomersController.getCustomerSites)
    .post(verifyJWT_MW, validateParam(schemas.idSchema, 'customerId'), validateBody(schemas.customerSiteSchema), CustomersController.newCustomerSite);
*/

router.route('/:serviceId/ack')
    .get(verifyJWT_MW, validateParam(schemas.idSchema, 'serviceId'), ServicesController.getServiceAcks)
    .post(verifyJWT_MW, validateParam(schemas.idSchema, 'serviceId'), validateBody(schemas.serviceAckSchema), ServicesController.newServiceAck);

router.route('/:serviceId/ack/:ackId')
    .delete(verifyJWT_MW, validateParam(schemas.idSchema, 'ackId'), ServicesController.deleteServiceAck);

router.route('/:serviceId/logs')
    .get(verifyJWT_MW, validateParam(schemas.idSchema, 'serviceId'), ServicesController.getServiceLogs);

router.route('/state/:stateId')
    .get(verifyJWT_MW, validateParam(schemas.stateIdSchema, 'stateId'), ServicesController.getServicesByState);

module.exports = router;