const mongoose = require('mongoose');

// MongoDB Connection URL
const con_url = "mongodb+srv://aakub1096:WeT2bzfibItBeoWB@collab-cluster.6pu29.mongodb.net/?retryWrites=true&w=majority&appName=collab-cluster";

// Establish Connection
const connect = mongoose.connect(con_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Handle Connection Success and Errors
connect
  .then(() => {
    console.log("Connected to MongoDB successfully (glogs database)");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
  });

// Define the Glog Schema
const glogSchema = new mongoose.Schema({
  displayName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
});

// Create the Glog Model
const Glog = mongoose.model('Glog', glogSchema, 'glogs');

// Export the Glog Model and Connection (optional)
module.exports = Glog;
