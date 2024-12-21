const mongoose=require("mongoose");
const Workspace = require("./workspace");
const con_url="mongodb+srv://aakub1096:WeT2bzfibItBeoWB@collab-cluster.6pu29.mongodb.net/?retryWrites=true&w=majority&appName=collab-cluster"
const connect=mongoose.connect(con_url);
connect.then(()=>{
    console.log("this connects to editor");
})
.catch(()=>{
    console.log("couldnt connect");
})
const contentSchema = new mongoose.Schema(
  {
  workspaceName:{type:String},
  content: {type:String},
  });

const Content = mongoose.model('Content', contentSchema);
module.exports = Content;