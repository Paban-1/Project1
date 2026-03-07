// Required Mongoose package
const mongoose = require('mongoose')

// Create a Schema for User
const postSchema = mongoose.Schema({
    // postSchema Have User Id as a reference to the User model
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },

    date: {
        type: Date,
        default: Date.now
    },
    content: String,
    likes: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    ]
})

// exporting the model to use in other files
module.exports = mongoose.model('post', postSchema)


