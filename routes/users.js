const express = require('express');
const router = require('express-promise-router')();

const verifyJWT_MW = require('../helpers/verifyJWT');
const UsersController = require('../controllers/users');

const { validateParam, validateBody, schemas } = require('../helpers/routeHelpers');

router.route('/')
    .get(verifyJWT_MW, UsersController.index)
    .post(verifyJWT_MW, validateBody(schemas.userSchema), UsersController.newUser);

router.route('/auth')
    .post(validateBody(schemas.authSchema), UsersController.auth);

router.route('/:userId/sites/hostgroups')
    .get(verifyJWT_MW, validateParam(schemas.idSchema, 'userId'), UsersController.getUserCustomerSitesHostgroups);

router.route('/:userId/sites/:siteId/hostgroups')
    .get(verifyJWT_MW, validateParam(schemas.idSchema, 'userId'), validateParam(schemas.idSchema, 'siteId'), UsersController.getUserCustomerSiteHostgroups);

router.route('/:userId/sites/')
    .get(verifyJWT_MW, validateParam(schemas.idSchema, 'userId'), UsersController.getUserSites);

router.route('/:userId/forgot/')
    .get(verifyJWT_MW, validateParam(schemas.idSchema, 'userId'), UsersController.forgotPassword);

router.route('/sites')
    .post(verifyJWT_MW, validateBody(schemas.userSiteSchema), UsersController.newUserSite);

router.route('/recover')
    .post(validateBody(schemas.recoverPasswordSchema), UsersController.recoverPassword);

router.route('/recover/:token')
    .get(validateParam(schemas.recoverToken, 'token'), UsersController.checkRecoverToken)
    .post(validateParam(schemas.recoverToken, 'token'), validateBody(schemas.updatePasswordSchema), UsersController.updatePassword);

router.route('/:userId/sites/:siteId')
    .delete(verifyJWT_MW, validateParam(schemas.idSchema, 'userId'), validateParam(schemas.idSchema, 'siteId'), UsersController.deleteUserCustomerSite);

router.route('/:userId')
    .delete(verifyJWT_MW, validateParam(schemas.idSchema, 'userId'), UsersController.deleteUser)
    .patch(verifyJWT_MW, validateParam(schemas.idSchema, 'userId'), validateBody(schemas.patchUserSchema), UsersController.replaceUser);

router.route('/:userId/profile')
    .patch(verifyJWT_MW, validateParam(schemas.idSchema, 'userId'), validateBody(schemas.patchUserSchema), UsersController.replaceUserProfile);

router.route('/:userId/password')
    .patch(verifyJWT_MW, validateParam(schemas.idSchema, 'userId'), validateBody(schemas.patchPasswordProfileSchema), UsersController.changePasswordProfile);

module.exports = router;