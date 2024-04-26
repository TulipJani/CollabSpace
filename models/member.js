const mongoose = require('mongoose');
const connect=mongoose.connect('mongodb://localhost:27017/HACKNUTHON');
connect.then(()=>{
    console.log("connected");
})
.catch(()=>{
    console.log("couldnt connect");
})
const memberSchema = new mongoose.Schema({
  memberName: {
    type: String,
    required: true
  },
  memberPosition: {
    type: String,
    required: true
  },
  taskToAssign: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  }
},{ collection: 'members' });
const Member = mongoose.model('members',memberSchema );
module.exports = Member;

