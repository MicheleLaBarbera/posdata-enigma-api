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
        stateIdSchema: Joi.object().keys({
            param: Joi.number().required()
        }), 
        recoverToken: Joi.object().keys({
            param: Joi.string().required()
        }), 
        nrSchema: Joi.object().keys({
            param: Joi.number().required()
        }),
        userSchema: Joi.object().keys({
            customer_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
            username: Joi.string().required(),
            password: Joi.string().required(),
            firstname: Joi.string().required(),
            lastname: Joi.string().required(),
            email: Joi.string().email().required(),
            role: Joi.number().required(),
            telegram_id: Joi.string(),
            phone_number: Joi.string(),
            office_number: Joi.string(),
        }),
        authSchema: Joi.object().keys({
            username: Joi.string().required(),
            password: Joi.string().required(),
            remember: Joi.number().required()
        }),
        customerSchema: Joi.object().keys({
            name: Joi.string().required(),            
            //address: Joi.string().required(),
            //vat_number: Joi.string().regex(/^[0-9]{11}$/).required(),
            customer_code: Joi.string().required(),
            referent_name: Joi.string().required(),
            phone_number: Joi.string().regex(/^[0-9]/).required(),
            email: Joi.string().email().required(),
            logo: Joi.string().required()
        }),
        patchCustomerSchema: Joi.object().keys({
            name: Joi.string(),            
            customer_code: Joi.string(),
            referent_name: Joi.string(),
            phone_number: Joi.string().regex(/^[0-9]/),
            email: Joi.string().email(),
            logo: Joi.string()
        }),
        patchUserSchema: Joi.object().keys({
            customer_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
            username: Joi.string(),
            firstname: Joi.string(),
            lastname: Joi.string(),
            email: Joi.string().email(),
            role: Joi.number(),
            telegram_id: Joi.string(),
            phone_number: Joi.string(),
            office_number: Joi.string(),
        }),
        patchAckSchema: Joi.object().keys({
            user_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
            code: Joi.string(),            
            message: Joi.string(),
            updated_at: Joi.string()
        }),
        patchCustomerSiteSchema: Joi.object().keys({
            ip_address: Joi.string(),
            port_number: Joi.number(),
            description: Joi.string()
        }),
        customerSiteSchema: Joi.object().keys({
            customer_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
            ip_address: Joi.string().required(),
            port_number: Joi.number().required(),
            description: Joi.string().required()
        }),
        userSiteSchema: Joi.object().keys({
            user_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
            customer_site_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
            notification: Joi.number().required(),
            telegram: Joi.number().required(),
            email: Joi.number().required(),
            sms: Joi.number().required()
        }),
        serviceAckSchema: Joi.object().keys({
            host_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
            service_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
            user_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
            customer_site_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
            message: Joi.string().required(),
            created_at: Joi.string().required(),
            expired: Joi.number().required(),
            code: Joi.string().regex(/^[0-9]/),
            updated_at: Joi.string().required()
        }),
        recoverPasswordSchema: Joi.object().keys({
            email: Joi.string().email().required(),
        }) 
    }
}