const mongoose=require('mongoose');
const connect=mongoose.connect('mongodb://localhost:27017/HACKNUTHON');
connect.then(()=>{
    console.log(" this is workspace connected");
})
.catch(()=>{
    console.log("couldnt connect");
})


const workspaceSchema = new mongoose.Schema({
  workspaceName: {
    type: String,
    required: true
  },user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Glog'
},createdBy: {
  type: String, 
  required: true
},
inviteMembers: [{ type: String }] 
});

const Workspace = mongoose.model('Workspace', workspaceSchema);

module.exports = Workspace;
