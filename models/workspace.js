const mongoose=require('mongoose');
const con_url="mongodb+srv://aakub1096:WeT2bzfibItBeoWB@collab-cluster.6pu29.mongodb.net/?retryWrites=true&w=majority&appName=collab-cluster"
const connect=mongoose.connect(con_url);
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
