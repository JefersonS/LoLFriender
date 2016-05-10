var express = require('express');
var router = express.Router();
var usersController = require('../controllers/users.server.controller');

/* GET users listing. */
router.get('/index', usersController.index);

router.get('/find', usersController.find);

router.get('/getFriends', usersController.get_friends);

module.exports = router;
