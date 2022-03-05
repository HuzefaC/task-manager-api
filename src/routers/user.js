const express = require('express');
const User = require('../models/user');
const auth = require('../middleware/auth');
const router = new express.Router();
const multer = require('multer');
const sharp = require('sharp');
const { sendEmail } = require('../email/account');

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpeg|jpg|png)$/)) {
      return cb(new Error('Please upload an image.'));
    }
    cb(undefined, true);
  },
});

// Create User
router.post('/users', async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    const message = `Welcome to the task-manager app ${user.name}. Hope you find our app useful!!`;
    const subject = 'Thank You for joining.';
    sendEmail(user.email, subject, message);
    const token = await user.genereateAuthToken();
    res.status(201).send({ user, token });
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Login user
router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );

    const token = await user.genereateAuthToken();
    res.send({ user, token });
  } catch (error) {
    res.status(400).send();
  }
});

// Logout user
router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

// Logout user from all devices
router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

// Get profile data
router.get('/users/me', auth, async (req, res) => {
  res.send(req.user);
});

// Update user
router.patch('/users/me', auth, async (req, res) => {
  const user = req.user;
  const body = req.body;
  const updates = Object.keys(body);
  const allowedUpdates = ['name', 'email', 'password', 'age'];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation)
    return res.status(400).send({ error: 'Invalid update operation!!' });

  try {
    updates.forEach((update) => (user[update] = req.body[update]));
    await user.save();
    res.send(user);
  } catch (error) {
    res.status(400).send();
  }
});

// Delete user
router.delete('/users/me', auth, async (req, res) => {
  try {
    const user = req.user;
    const message = `Thank you for using the task-manager app. Your account has been deleted successfully.`;
    const subject = 'Thank You for using our services.';
    await req.user.remove();
    sendEmail(user.email, subject, message);
    res.send(req.user);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Upload avatar
router.post(
  '/users/me/avatar',
  auth,
  upload.single('avatar'),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

// Delete avatar
router.delete('/users/me/avatar', auth, async (req, res) => {
  try {
    if (!req.user.avatar) throw new Error();
    req.user.avatar = undefined;
    await req.user.save();
    sendEmail();
    res.send();
  } catch (error) {
    res.status(404).send();
  }
});

// Get avatar by id
router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error();
    }

    res.set('Content-Type', 'image/png');
    res.send(user.avatar);
  } catch (error) {
    res.status(404).send();
  }
});

module.exports = router;
