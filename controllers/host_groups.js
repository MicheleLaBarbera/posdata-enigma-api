const Host = require('../models/host');
const HostLog = require('../models/host_log');
const CustomerSite = require('../models/customer_site');
const Customer = require('../models/customer');
const ServiceLog = require('../models/service_log');
const ServiceLastLog = require('../models/service_last_log');
const ServiceAck = require('../models/service_ack');
const ObjectId = require('mongoose').Types.ObjectId;
const ServiceCompleteInfo = require('../models/service_complete_info');
const HostCompleteInfo = require('../models/host_complete_info');
const Service = require('../models/service');

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}

function sortByKey(array, key) {
    return array.sort(function(a, b) {
        var x = a[key]; var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}

function predicate() {
    var fields = [], n_fields = arguments.length, field, name, reverse, cmp;

    var default_cmp = function (a, b) {
        if (a === b) return 0;
        return a < b ? -1 : 1;
        },
        getCmpFunc = function (primer, reverse) {
        var dfc = default_cmp,
            // closer in scope
            cmp = default_cmp;
        if (primer) {
            cmp = function (a, b) {
            return dfc(primer(a), primer(b));
            };
        }
        if (reverse) {
            return function (a, b) {
            return -1 * cmp(a, b);
            };
        }
        return cmp;
        };

    // preprocess sorting options
    for (var i = 0; i < n_fields; i++) {
        field = arguments[i];
        if (typeof field === 'string') {
        name = field;
        cmp = default_cmp;
        } else {
        name = field.name;
        cmp = getCmpFunc(field.primer, field.reverse);
        }
        fields.push({
        name: name,
        cmp: cmp
        });
    }

    // final comparison function
    return function (A, B) {
        var a, b, name, result;
        for (var i = 0; i < n_fields; i++) {
        result = 0;
        field = fields[i];
        name = field.name;

        result = field.cmp(A[name], B[name]);
        if (result !== 0) break;
        }
        return result;
    };
}

module.exports = {        
    getServicesCount: async (req, res, next) => {
        const { hostGroupId } = req.value.params;
        
        const services = await ServiceLastLog.find({ customer_site_id: hostGroupId });
        
        let results = {
            services_ok: 0,
            services_warn: 0,
            services_crit: 0,
            services_unkn: 0,
            services_ack: 0,
            services_total: 0
        };
        await asyncForEach(services, async (element) => {
            switch(element.service_state) {
                case 0: {
                    results.services_ok++;
                    results.services_total++;
                    break;
                }
                case 1: {
                    let service_ack = await ServiceAck.find({ service_id: element.service_id, expired: 0 }).sort({ created_at: -1 }).limit(1);
                    if(service_ack[0] != null) {
                        results.services_ack++;
                        //results.services_ok++;
                    }
                    else {
                        results.services_warn++;
                    }
                    results.services_total++;
                    break;
                }
                case 2: {
                    let service_ack = await ServiceAck.find({ service_id: element.service_id, expired: 0 }).sort({ created_at: -1 }).limit(1);
                    if(service_ack[0] != null) {
                        results.services_ack++;
                        //results.services_ok++;
                    }
                    else {
                        results.services_crit++;
                    }
                    results.services_total++;
                    break;
                }
                case 3: {
                    let service_ack = await ServiceAck.find({ service_id: element.service_id, expired: 0 }).sort({ created_at: -1 }).limit(1);
                    if(service_ack[0] != null) {
                        results.services_ack++;
                        //results.services_ok++;
                    }
                    else {
                        results.services_unkn++;
                    }
                    results.services_total++;
                    break;
                }
            }
        });
        res.status(200).json(results);
    }
};