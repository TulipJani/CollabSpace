## Backend Setup

Install Dependencies:
npm init -y
npm install express mongoose cors

---

Create a Server:
Create a file named server.js and add the following code:

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

---

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/wysiwyg', { useNewUrlParser: true, useUnifiedTopology: true });

// Define a schema for the content
const contentSchema = new mongoose.Schema({
content: String
});

// Create a model from the schema
const Content = mongoose.model('Content', contentSchema);

// Endpoint to save content
app.post('/save', async (req, res) => {
try {
const content = new Content({ content: req.body.content });
await content.save();
res.send({ message: 'Content saved successfully' });
} catch (error) {
res.status(500).send({ message: 'Error saving content' });
}
});

// Endpoint to retrieve content
app.get('/load', async (req, res) => {
try {
const content = await Content.findOne();
res.send({ content: content ? content.content : '' });
} catch (error) {
res.status(500).send({ message: 'Error loading content' });
}
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

---

Frontend Modifications
Modify the app Function:
Add methods to save and load content from the backend.

function app() {
return {
wysiwyg: null,
content: '',
init: function (el) {
this.wysiwyg = el;
this.loadContent();
},
loadContent: async function () {
const response = await fetch('/load');
const data = await response.json();
this.content = data.content;
this.wysiwyg.contentDocument.body.innerHTML = this.content;
},
saveContent: async function () {
await fetch('/save', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ content: this.wysiwyg.contentDocument.body.innerHTML })
});
},
format: function (cmd, param) {
this.wysiwyg.contentDocument.execCommand(cmd, false, param || null);
this.saveContent(); // Save content after formatting
},
};
}

---

Modify the HTML:
Ensure the x-data and x-init attributes are correctly set up to use the modified app function.

<div
 class="w-full max-w-screen h-fit mx-auto rounded-xl bg-[#171717] shadow-lg p-5 text-white"
 x-data="app()"
 x-init="init($refs.wysiwyg)"
>
 <!-- Your existing HTML here -->
</div>

---

Running the Application
Start the Backend:
node server.js

---

Serve Your Frontend:
You can serve your frontend using any static server or integrate it with your backend.

This setup provides a basic structure for persisting the WYSIWYG editor content. You'll need to adjust the database connection and schema according to your specific requirements.
