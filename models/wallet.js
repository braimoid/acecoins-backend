const mongoose = require('mongoose')

const WalletSchema = new mongoose.Schema({
    transactionId: { type: String },
    user: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }
    },
    success: { type: Boolean, default: false },
    isChecked: { type: Boolean, default: false },
    checkCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
})

mongoose.models = {};
module.exports = mongoose.model('Wallet', WalletSchema);
