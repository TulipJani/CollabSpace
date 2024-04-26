const mongoose=require('mongoose');
const connect=mongoose.connect('mongodb://localhost:27017/HACKNUTHON');
connect.then(()=>{
    console.log("connected");
})
.catch(()=>{
    console.log("couldnt connect");
})
const loginschema=new mongoose.Schema({
    displayname:{
        type:String,
        required:true
    },email:{
        type:String,
        required:true
    }
});
const collection=new mongoose.model("users",loginschema);
module.exports=collection;