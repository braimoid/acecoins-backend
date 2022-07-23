const mongoose = require('mongoose')


const PaymentSchema = new mongoose.Schema({
        payment_id: String,
        pay_address: String,
        pay_amount: Number,
        payment_status: String,
        user:{
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            username: String
    },
    createdAt: {type: Number, default:new Date().getTime()}

})

mongoose.models = {}
module.exports = mongoose.model('Payment', PaymentSchema)