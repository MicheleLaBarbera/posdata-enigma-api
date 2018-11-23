const express = require('express');
const router = require('express-promise-router')();

const verifyJWT_MW = require('../helpers/verifyJWT');
const UserLogsController = require('../controllers/user_logs');

const { validateParam, validateBody, schemas } = require('../helpers/routeHelpers');

router.route('/:userId/action/:actionType')
    .get(verifyJWT_MW, validateParam(schemas.idSchema, 'userId'), validateParam(schemas.nrSchema, 'actionType'), UserLogsController.getUserLogs);

module.exports = router;