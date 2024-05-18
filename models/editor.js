const mongoose=require("mongoose");
const Workspace = require("./workspace");

const connect=mongoose.connect('mongodb://localhost:27017/HACKNUTHON');
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