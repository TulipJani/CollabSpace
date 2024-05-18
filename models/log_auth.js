const mongoose = require('mongoose');
const connect=mongoose.connect('mongodb://localhost:27017/HACKNUTHON');
connect.then(()=>{
    console.log(" this is glog connected");
})
.catch(()=>{
    console.log("couldnt connect");
})

const glogSchema = new mongoose.Schema({
    displayName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    }
});

const Glog = mongoose.model('Glog', glogSchema, 'glogs');

module.exports = Glog;
