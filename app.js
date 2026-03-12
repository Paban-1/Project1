// Required dependencies
const express = require('express')
const app = express()
const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const multer = require('multer')
const crypto = require('crypto')
const path = require('path')

// Require Models
const userModel = require('./models/user')
const postModel = require('./models/post')

// Dependencies setup
app.set("view engine", "ejs")
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/uploads')
    },
    filename: function (req, file, cb) {
        crypto.randomBytes(12, function (err, bytes) {
            // console.log(bytes.toString('hex'));
            // Handle extension and filename
            const fn = bytes.toString('hex') + path.extname(file.originalname)
            cb(null, fn)
        })
    }
})

const upload = multer({ storage: storage })


// Render index Routes 
app.get('/', (req, res) => {
    res.render("index")
})

// Test Route
app.get('/test', (req, res) => {
    res.render("test")
})

// Test Upload Route
app.post('/upload', upload.single('image'), (req, res) => {
    console.log(req.file);
    //   console.log(req.file);
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

// Create Like Route
app.get('/like/:id', isLoggedIn, async (req, res) => {
    // Finding the post and populating the user field to get the user details
    let post = await postModel.findOne({ _id: req.params.id }).populate('user')

    // Checking if the user has already liked the post or not
    if (post.likes.indexOf(req.user.userId) === -1) {
        // Pushing the user id to the likes array of the post
        post.likes.push(req.user.userId)
    } else {
        // Removing the user id from the likes array of the post
        post.likes.splice(post.likes.indexOf(req.user.userId), 1)
    }
    // Saving the post
    await post.save()
    // Redirecting to the profile page
    res.redirect("/profile")
})

// Create Edit Route
app.get('/edit/:id', isLoggedIn, async (req, res) => {
    // Finding the post and populating the user field to get the user details
    let post = await postModel.findOne({ _id: req.params.id }).populate('user')

    // rendering the edit page and passing the post details to the page
    res.render('edit', { post })
})

app.post("/update/:id", isLoggedIn, async (req, res) => {
    // Finding the post and populating the user field to get the user details
    let post = await postModel.findOneAndUpdate({ _id: req.params.id }, { content: req.body.content })

    // Redirecting to the profile page
    res.redirect('/profile')
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