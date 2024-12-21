const mongoose = require('mongoose');
const con_url="mongodb+srv://aakub1096:WeT2bzfibItBeoWB@collab-cluster.6pu29.mongodb.net/?retryWrites=true&w=majority&appName=collab-cluster"
const connect=mongoose.connect(con_url);
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
