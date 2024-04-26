const mongoose=require('mongoose');
const connect=mongoose.connect('mongodb://localhost:27017/HACKNUTHON');
connect.then(()=>{
    console.log("connected");
})
.catch(()=>{
    console.log("couldnt connect");
})


const workspaceSchema = new mongoose.Schema({
  workspaceName: {
    type: String,
    required: true
  }
});

// Create workspace model
const Workspace = mongoose.model('Workspace', workspaceSchema);

module.exports = Workspace;
