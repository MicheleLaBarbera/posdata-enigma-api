// Index
const express = require('express');
const logger = require('morgan');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const cors = require('cors');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://192.168.5.86:27017/scheduler', { useNewUrlParser: true });

const app = express();
app.use(cors());
app.use(helmet());

// Routes
const users = require('./routes/users');
const customers = require('./routes/customers');
const hosts = require('./routes/hosts');
const services = require('./routes/services');
const scheduler_infos = require('./routes/scheduler_infos');
const host_groups = require('./routes/host_groups');
const customer_sites = require('./routes/customer_sites');
const services_logs = require('./routes/services_logs');

// Middlewares 
app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'}));

// Routes
app.use('/users', users);
app.use('/customers', customers);
app.use('/hosts', hosts);
app.use('/services', services);
app.use('/scheduler_infos', scheduler_infos);
app.use('/hostgroups', host_groups);
app.use('/customer_sites', customer_sites);
app.use('/services_logs', services_logs);

// Catch 404 Errors and forward them to error handler
app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// Error handler function
app.use((err, req, res, next) => {    
    const error = app.get('env') === 'development' ? err : {};
    const status = err.status || 500;

    // Respond to client
    res.status(status).json({
        error: {
            message: error.message
        }
    });

    // Respond to ourselves
    console.log(err);
});

// Start the server
const port = app.get('port') || 3000;
app.listen(port, () => console.log(`Server is listening  on port ${port}`));