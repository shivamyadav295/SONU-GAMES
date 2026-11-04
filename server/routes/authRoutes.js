const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/recover', authController.recoverAccount);
router.post('/guest', authController.guestLogin);
router.get('/me', authenticate, authController.getMe);
router.post('/recovery-code', authenticate, authController.createRecoveryCode);
router.put('/profile', authenticate, authController.updateProfile);

module.exports = router;
