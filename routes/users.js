var express = require('express');
var router = express.Router();
var usersController = require('../controllers/users.server.controller');

/* GET users listing. */
router.get('/index', usersController.index);

router.get('/find', usersController.find);

router.post('/tell_summoner', usersController.tell_summoner);

module.exports = router;
