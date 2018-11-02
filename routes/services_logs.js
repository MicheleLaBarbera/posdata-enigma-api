const express = require('express');
const router = require('express-promise-router')();

const ServicesController = require('../controllers/services');

router.route('/')
    .get(ServicesController.getServicesLastLogs);

module.exports = router;