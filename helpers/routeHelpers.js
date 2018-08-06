const Joi = require('joi');

module.exports = {
    validateParam: (schema, name) => {
        return (req, res, next) => {
            const result = Joi.validate({ param: req['params'][name] }, schema);
            if(result.error) {
                return res.status(400).json(result.error);
            } else {
                if(!req.value)
                    req.value = {};
                
                if(!req.value['params'])
                    req.value['params'] = {}; 

                req.value['params'][name] = result.value.param;
                next();
            }
        }
    },
    validateBody: (schema) => {
        return (req, res, next) => {
            const result = Joi.validate(req.body, schema);

            if(result.error) {
                return res.status(400).json(result.error);
            } else {
                if(!req.value)
                    req.value = {};

                if(!req.value['body'])
                    req.value['body'] = {};

                req.value['body'] = result.value;
                next();
            }
        }
    },
    schemas: {
        idSchema: Joi.object().keys({
            param: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
        }),
        userSchema: Joi.object().keys({
            customer_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
            username: Joi.string().required(),
            password: Joi.string().required(),
            firstname: Joi.string().required(),
            lastname: Joi.string().required(),
            email: Joi.string().email().required(),
            role: Joi.number().required(),
            telegram_id: Joi.string().required()
        }),
        authSchema: Joi.object().keys({
            username: Joi.string().required(),
            password: Joi.string().required()
        }),
        customerSchema: Joi.object().keys({
            name: Joi.string().required(),
            logo: Joi.string().required()
        }),
        customerSiteSchema: Joi.object().keys({
            customer_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
            ip_address: Joi.string().required(),
            port_number: Joi.number().required(),
            description: Joi.string().required()
        })        
    }
}