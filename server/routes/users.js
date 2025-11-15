const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// User CRUD routes
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

// Login route
router.post('/login', userController.login);

module.exports = router;
