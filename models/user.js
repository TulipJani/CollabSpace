const mongoose=require('mongoose');
const connect=mongoose.connect('mongodb://localhost:27017/HACKNUTHON');
connect.then(()=>{
    console.log("connected");
})
.catch(()=>{
    console.log("couldnt connect");
})


const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
}, {
  collection: 'Project' 
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;

