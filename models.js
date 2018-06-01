'use strict';

const mongoose = require('mongoose');

const storySchema = mongoose.Schema({
    title: {type: String, required: true},
    body: {type: String, required: true},
    likes: {type: Number, default: 0},
    date: {type: Date, default: Date.now}
});

storySchema.methods.serialize = function(){
    return {
        id: this._id,
        title: this.title,
        body: this.body,
        likes: this.likes,
        date: this.date
    };
};

const Story = mongoose.model('Story', storySchema);

module.exports = {Story};