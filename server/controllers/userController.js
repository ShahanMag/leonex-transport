const User = require('../models/User');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').lean();
    res.status(200).json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
};

// Create user
exports.createUser = async (req, res) => {
  try {
    const { username, password, role, email, fullName } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const user = new User({
      username,
      password, // In production, hash this with bcrypt
      role: role || 'user',
      email,
      fullName,
    });

    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'User created successfully',
      user: userResponse,
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { username, password, role, email, fullName, isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if new username already exists (if changing username)
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      user.username = username;
    }

    if (password) user.password = password; // In production, hash this
    if (role) user.role = role;
    if (email !== undefined) user.email = email;
    if (fullName !== undefined) user.fullName = fullName;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      message: 'User updated successfully',
      user: userResponse,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deletion of superadmin
    if (user.role === 'superadmin') {
      return res.status(403).json({ message: 'Cannot delete superadmin user' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({ username, isActive: true });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // In production, use bcrypt.compare()
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Create dummy token
    const token = Buffer.from(JSON.stringify({
      userId: user._id,
      username: user.username,
      role: user.role,
      exp: Date.now() + (24 * 60 * 60 * 1000),
    })).toString('base64');

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      message: 'Login successful',
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
};

// Initialize default users (superadmin and admin)
exports.initializeDefaultUsers = async () => {
  try {
    const userCount = await User.countDocuments();

    if (userCount === 0) {
      const defaultUsers = [
        {
          username: 'superadmin',
          password: '123456789',
          role: 'superadmin',
          fullName: 'Super Administrator',
          email: 'superadmin@EESA.com',
          isActive: true,
        },
        {
          username: 'admin',
          password: '123456789',
          role: 'admin',
          fullName: 'Administrator',
          email: 'admin@EESA.com',
          isActive: true,
        },
      ];

      await User.insertMany(defaultUsers);
      console.log('✅ Default users created: superadmin and admin (password: 123456789)');
    }
  } catch (error) {
    console.error('Error initializing default users:', error);
  }
};
