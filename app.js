// Required dependencies
const express = require('express')
const app = express()
const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// Require Models
const userModel = require('./models/user')
const postModel = require('./models/post')

// Dependencies setup
app.set("view engine", "ejs")
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Render index Routes 
app.get('/', (req, res) => {
    res.render("index")
})

// Render login Routes 
app.get('/login', (req, res) => {
    res.render("login")
})

// Procected Route
app.get('/profile', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email }).populate('posts')

    res.render('profile', { user })
})

// Create a post Route
app.post('/post', isLoggedIn, async (req, res) => {
    // Finding the user
    let user = await userModel.findOne({
        email: req.user.email
    })
    // Destructuring the request body
    let { content } = req.body

    // Create a new post
    let post = await postModel.create({
        user: user._id,
        content,
    })

    // Give user the post id
    user.posts.push(post._id)
    await user.save()

    res.redirect('/profile')
})

// Create a Register Route
app.post('/register', async (req, res) => {
    // Destructuring the request body
    let { email, password, name, username, age } = req.body

    let user = await userModel.findOne({ email })
    if (user) return res.status(500).send("User already exists")

    // Creating a new user With Bcrypt
    bcrypt.genSalt(10, (err, salt) => {
        // Hashing the password
        bcrypt.hash(password, salt, async (err, hash) => {
            // Creating a new user with the hashed password
            let CreatedUser = await userModel.create({
                username,
                name,
                email,
                age,
                password: hash
            })
            //  Creating a JWT token
            let token = jwt.sign({ email: email, userId: CreatedUser._id }, "lima")
            // Setting the token in the cookie
            res.cookie('token', token);
            res.send('Registered Successfully')
        })
    })
})

// Create a login Route
app.post('/login', async (req, res) => {
    // Destructuring the request body
    let { email, password } = req.body

    // Finding User Based on the email
    let user = await userModel.findOne({ email })
    if (!user) return res.status(500).send("Somthing went wrong")

    // Comparing the password with the hashed password
    bcrypt.compare(password, user.password, function (err, result) {
        if (result) {
            let token = jwt.sign({ email: email, userId: user._id }, "lima")
            res.cookie('token', token)
            res.status(200).redirect("/profile")
        } else res.redirect('/login')
    })
})

// Create a logout Route
app.get('/logout', (req, res) => {
    res.cookie('token', "");
    res.redirect('/login')
})

// Create a Protacted Route
function isLoggedIn(req, res, next) {
    if (req.cookies.token === "") res.redirect("/login")
    else {
        let data = jwt.verify(req.cookies.token, "lima");
        req.user = data
        next()
    }
}

// Activeting Port
app.listen(3000, () => {
    console.log("Server is running on port 3000");
})