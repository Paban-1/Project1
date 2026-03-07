// Required Mongoose package
const mongoose = require('mongoose')

// Connecting to MongoDB databases
mongoose.connect('mongodb://127.0.0.1:27017/mini-project',).then(() => {
    // Get a Connection Response
    console.log("MONGODB Connected ");
})

// Create a Schema for User
const userSchema = mongoose.Schema({
    username: String,
    name: String,
    age: Number,
    email: String,
    password: String,
    posts: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'post' }
    ]
})

// exporting the model to use in other files
module.exports = mongoose.model('user', userSchema)


