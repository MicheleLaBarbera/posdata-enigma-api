const express = require('express');
const router = require('express-promise-router')();

const verifyJWT_MW = require('../helpers/verifyJWT');
const SchedulerInfosController = require('../controllers/scheduler_infos');

router.route('/lastcheck')
    .get(verifyJWT_MW, SchedulerInfosController.getLastCheck);

module.exports = router;