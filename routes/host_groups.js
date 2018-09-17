const express = require('express');
const router = require('express-promise-router')();

const verifyJWT_MW = require('../helpers/verifyJWT');
const HostGroupsController = require('../controllers/host_groups');

const { validateParam, validateBody, schemas } = require('../helpers/routeHelpers');

router.route('/:hostGroupId/services')
    .get(verifyJWT_MW, validateParam(schemas.idSchema, 'hostGroupId'), HostGroupsController.getServicesCount)

module.exports = router;