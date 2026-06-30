const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    generatedText: { 
        type: String, 
        required: true 
    },
    tags: [String],
    status: { 
        type: String, 
        enum: ['Draft', 'Published'], 
        default: 'Draft' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Content', ContentSchema);