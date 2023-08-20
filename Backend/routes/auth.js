const express =  require('express');
const router = express.Router();
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
var fetchuser = require('../middleware/fetchuser')
const JWT_SECRET = 'AdityaIsagoodb$oy'

// Route 1: create a user using: POST "/api/auth/createuser". No login required
router.post('/createuser', [
    body('name').isLength({ min: 3 }),
    body('email').isEmail(),
    body('password').isLength({ min: 8 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const salt = await bcrypt.genSalt(10);
        const secPass = await bcrypt.hash(req.body.password, salt)
        const user = await User.create({
            name: req.body.name,
            password: secPass,
            email: req.body.email,
        });

        const data = {
            user:{
                id:user.id
            }
        }

        const authToken = jwt.sign(data, JWT_SECRET);
        res.json({authToken})
        
        res.json(user);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

// Route 2: login a user using: POST "/api/auth/login". No login require
router.post('/login',[
    body('email','Enter a valid email').isEmail(),
    body('password','Password cannot be Blank').exists()
],async(req,res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty())
    {
        return res.status(400).json({ errors: errors.array()})
    }

    const {email, password} = req.body;
    try {
        let user = await User.findOne({email});
        if(!user)
        {
            return res.status(400).json({error:"Please try to login with correct credentials"});
        }

        const passwordCompare = await bcrypt.compare(password, user.password)
        if(!passwordCompare)
        {
            return res.status(400).json({error:"Please try to login with correct credentials"});
        }

        const data = {
            user:{
                id:user.id
            }
        }
        const authToken = jwt.sign(data, JWT_SECRET);
        res.json({authToken})
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Internal Server error' });
    }
})

// Route 3: Get loggedin User Details using: POST "/api/auth/getuser". Login required
router.post('/getuser',fetchuser ,async(req, res) => {
    try {
        userId = req.user.id;
        const user = await User.findById(userId).select("-password")
        res.send(user);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Internal Server error' });
    }
})

module.exports = router;
