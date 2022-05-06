const mongoose = require('mongoose')

const WithdrawalSchema = new mongoose.Schema({
    amount: Number,
    address: String,
    status: { type: String, default: 'Pending' },
    user: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        username: String,
        firstname: String,
        lastname: String
    },
    createdAt: { type: Date, default: Date.now() }

})

mongoose.models = {}
module.exports = mongoose.model('Withdrawal', WithdrawalSchema)