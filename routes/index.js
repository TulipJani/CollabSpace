const express = require("express");
const session = require("express-session");
const auth = require("../log_auth/auth");
const git_auth=require("../log_auth/git_auth");

const fs = require("fs");
const cors=require('cors');
const Content=require("../models/content");
const validator=require("validator");
const Workspace = require("../models/workspace");
const nodemailer = require("nodemailer");

const passport = require("passport");
function isLoggedIn(req, res, next) {
  req.user ? next() : res.sendStatus(401);
}
const bodyParser = require("body-parser");

const path = require("path");
const multer = require("multer");

const Glog = require("../models/log_auth");
const app = express();

const server=require('http').createServer(app);
const {Server}=require("socket.io");
const { log } = require("console");
const io=new Server(server);
io.on('connection',socket=>{
  console.log(socket,"connected")
})

app.use(express.static("public"));
app.use(cors());
app.use(session({ secret: "dogs" , resave: false, 
  saveUninitialized: true, }));
app.use(passport.initialize());
app.use(passport.session());
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "hacknuthon@gmail.com",
    pass: "ymmr skfn fozs uaki",
  },
});



app.get('/',(req,res)=>{
  res.render('index', { title: 'Express Home' });
})


app.get('/gittry',(req,res)=>{
  res.render('githome');
})
const Queue = require('bull');
const emailQueue = new Queue('email', {
  redis: { host: 'localhost', port: 6379 }, // Your Redis server config
});

function sendCongratulatoryEmail(userEmail) {
  // Add email job to queue
  emailQueue.add({ email: userEmail });
}

// Process email jobs in the background
emailQueue.process(async (job) => {
  const { email } = job.data;
  const mailOptions = {
    from: "hacathon2k23@gmail.com",
    to: email,
    subject: "Congratulations on your successful login!",
    text: "Thank you for logging in.",
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log("Error sending email:", error);
        reject(error);
      } else {
        console.log("Email sent:", info.response);
        resolve(info.response);
      }
    });
  });
});

app.get("/home", isLoggedIn, async (req, res) => {
  const { displayName, email } = req.user;

  try {
    console.time("Save User Data");
    Glog.updateOne({ email }, { displayName, email }, { upsert: true }).exec();
    console.timeEnd("Save User Data");

    console.time("Send Email");
    sendCongratulatoryEmail(email);
    console.timeEnd("Send Email");

    console.time("Fetch Workspaces");
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const workspaces = await Workspace.find({ createdBy: displayName })
      .select("workspaceName createdBy")
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    console.timeEnd("Fetch Workspaces");

    console.time("Render Home");
    res.render("home", { displayName, workspaces });
    console.timeEnd("Render Home");
  } catch (error) {
    console.error("Error in GET /home route:", error.stack || error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/home", isLoggedIn, async (req, res) => {
  const { displayName } = req.user;
  const { workspaceName } = req.body;

  try {
    console.time("Validate Workspace Name");
    // Validate workspace name
    if (!workspaceName || typeof workspaceName !== "string" || workspaceName.trim() === "") {
      throw new Error("Invalid workspace name");
    }
    console.timeEnd("Validate Workspace Name");

    console.time("Check Duplicate Workspace");
    // Check if a workspace with the same name already exists for the user
    const existingWorkspace = await Workspace.findOne({ workspaceName, createdBy: displayName });
    if (existingWorkspace) {
      throw new Error("Workspace with this name already exists");
    }
    console.timeEnd("Check Duplicate Workspace");

    console.time("Create New Workspace");
    // Create a new workspace
    const newWorkspace = new Workspace({ workspaceName, createdBy: displayName });
    await newWorkspace.save();
    console.timeEnd("Create New Workspace");

    console.time("Redirect to Workspace");
    // Redirect to the newly created workspace page
    res.redirect(`/workspace/${workspaceName}/${displayName}`);
    console.timeEnd("Redirect to Workspace");
  } catch (error) {
    console.error("Error in POST /home route:", error.stack || error.message);

    // Send detailed error response for debugging (optional in production)
    if (error.message === "Invalid workspace name") {
      return res.status(400).send("Invalid workspace name. Please provide a valid name.");
    }
    if (error.message === "Workspace with this name already exists") {
      return res.status(409).send("A workspace with this name already exists.");
    }

    res.status(500).send("Internal Server Error");
  }
});



app.post('/deleteWorkspace/:workspaceId', async (req, res) => {
  
  const workspaceId = req.params.workspaceId;

  try {
   
    const deletedWorkspace = await Workspace.findByIdAndDelete(workspaceId);
    
    if (!deletedWorkspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    res.redirect("/home");
  } catch (error) {
    console.error('Error deleting workspace:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/load', async (req, res) => {
  try {
  const content = await Content.findOne();
  res.send({ content: content ? content.content : '' });
  } catch (error) {
  res.status(500).send({ message: 'Error loading content' });
  }
  });
  
  app.post('/update', async (req, res) => {
    try {
      const { workspaceName, content } = req.body;
      
      const updatedContent = await Content.findOneAndUpdate(
        { workspaceName },
        { content },
        { new: true, useFindAndModify: false }
      );
  
      if (!updatedContent) {
        return res.status(404).send({ message: 'Content not found' });
      }
  
      res.send({ message: 'Content updated successfully', updatedContent });
    } catch (error) {
      res.status(500).send({ message: 'Error updating content', error: error.message });
    }
  });
  
  function sendCongratulatoryEmail(userEmail) {
    return new Promise((resolve, reject) => {
      // Email content
      const mailOptions = {
        from: "hacathon2k23@gmail.com",
        to: userEmail,
        subject: "Congratulations on your successful login!",
        text: "Thank you for logging in.",
      };
  
      // Send email
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log("Error sending email:", error);
          reject(error); // Reject the Promise with the error
        } else {
          console.log("Email sent:", info.response);
          resolve(info.response); // Resolve the Promise with the response
        }
      });
    });
  }
  

app.all('/workspace/:workspaceName/:username', async (req, res) => {
  const { workspaceName, username } = req.params;

  try {
    const user = await Glog.findOne({ displayName: username });
    if (!user) {
      return res.status(404).send('User not found');
    }

    let workspace = await Workspace.findOne({ workspaceName, createdBy: user._id });
    if (!workspace) {
     
      workspace = await Workspace.create({ workspaceName, createdBy: user._id, inviteMembers: [] });
    }
    if (req.method === 'POST') {
      const { email,content } = req.body;

      if (workspace.inviteMembers.includes(email)) {
        return res.status(400).send("Email already invited to this workspace");
      }

      workspace.inviteMembers.push(email);
      await workspace.save();
      sendEmailInvitation(email, workspaceName, username);
      
      io.to(workspaceName).emit('invite', { workspaceName, email });
    }
    const content = await Content.findOne({ workspaceName });
   
    res.render('workspace', { workspace, workspaceName, username,content });
   
  } catch (error) {
    console.error("Error handling workspace request:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post('/save', async (req, res) => {
  try {
    const { workspaceName, content } = req.body;
    const newContent = new Content({ workspaceName, content });
    await newContent.save();
  res.send({ message: 'Content saved successfully in th db' });
  } catch (error) {
  res.status(500).send({ message: 'Error saving content' });
  }
  });

app.get('/load', async (req, res) => {
    try {
    const { workspaceName } = req.body;
    const content = await Content.findOne({workspaceName});
    res.json(content);
    //res.send({ content: content ? content.content : '' });
    } catch (error) {
    res.status(500).send({ message: 'Error loading content' });
    }
  });

function sendEmailInvitation(email, workspaceName,username) {
  

  const mailOptions = {
    from: "hacathon2k23@gmail.com",
    to: email,
    subject: "Join the workspace",
    html:`
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body>
    <button style="display: inline-block; background-color: #2a2a2a; color: #d3d3d3; font-weight: bold; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 9999px;"><a style="color: #fff; text-decoration:none;" href="http://localhost:5000/workspace/${workspaceName}/${username}">Accept Invitation</a></button>

    </body>
    </html>`
    
  };

  // Send email
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  })

}
  
io.on('connection', socket => {
  console.log('A user connected');
  socket.on('textUpdate', text => {
    socket.broadcast.emit('textUpdate', text);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
 
});
app.get("/auth", (req, res) => {
  console.log('Rendering Google Authentication page');
  res.render("googleAuth");
});

app.get("/auth/google", passport.authenticate("google", { scope: ["email", "profile"] }), (req, res) => {
  console.log('Initiating Google authentication');
});

app.get("/google/callback", passport.authenticate("google", {
  successRedirect: "/home",
  failureRedirect: "/auth/fail",
}), (req, res) => {
  console.log('Google authentication callback');
});


app.get('/auth/github',
  passport.authenticate('github', { scope: [ 'user:email' ] }));

app.get('/github/callback', 
  passport.authenticate('github', { failureRedirect: '/auth' }),
  function(req, res) {
   
    res.redirect('/gittry');
  });

app.get("/logout", (req, res) => {
  req.logOut();
  req.session.destroy();
  res.send("Goodbye");
});
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
module.exports = app;

