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
    console.time("Total Request Time");

    // Step 1: Save user data (timed)
    console.time("Save User Data");
    const guser = new Glog({
      displayName,
      email,
    });
    await guser.save();
    console.timeEnd("Save User Data");

    // Step 2: Send congratulatory email (non-blocking)
    console.time("Send Email");
    sendCongratulatoryEmail(email); // Fire-and-forget
    console.timeEnd("Send Email");

    // Step 3: Fetch workspaces with pagination
    console.time("Fetch Workspaces");
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = 10; // Fetch 10 results per page
    const workspaces = await Workspace.find({ createdBy: displayName })
      .select("workspaceName createdBy") // Fetch only required fields
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(); // Return plain JavaScript objects for faster rendering
    console.timeEnd("Fetch Workspaces");

    // Step 4: Render the home page
    console.time("Render Home");
    res.render("home", { displayName, workspaces });
    console.timeEnd("Render Home");

    console.timeEnd("Total Request Time");
  } catch (error) {
    console.error("Error in GET /home route:", error.stack || error.message);

    // Detailed error response
    if (error.name === "ValidationError") {
      return res.status(400).send("Invalid request data.");
    }

    res.status(500).send("Internal Server Error");
  }
});
// POST /create-workspace - New Route
app.post("/create-workspace", isLoggedIn, async (req, res) => {
  const { displayName } = req.user;
  const { workspaceName } = req.body;

  try {
    console.time("Total Request Time");

    // Step 1: Validate workspace name
    if (!workspaceName || typeof workspaceName !== "string" || workspaceName.trim() === "") {
      console.error("Invalid workspace name provided");
      return res.status(400).json({ error: "Invalid workspace name." });
    }

    console.time("Create Workspace");

    // Step 2: Check if workspace already exists
    const existingWorkspace = await Workspace.findOne({ workspaceName, createdBy: displayName }).lean();
    if (existingWorkspace) {
      console.error("Workspace already exists.");
      return res.status(409).json({ error: "Workspace already exists." });
    }

    // Step 3: Create a new workspace
    const newWorkspace = new Workspace({ workspaceName, createdBy: displayName });
    await newWorkspace.save();
    console.timeEnd("Create Workspace");

    // Step 4: Log success and redirect
    console.log("Workspace created successfully:", workspaceName);
    res.status(201).json({
      message: "Workspace created successfully.",
      redirect: `/workspace/${workspaceName}/${displayName}`,
    });

    console.timeEnd("Total Request Time");
  } catch (error) {
    console.error("Error in POST /create-workspace route:", error.stack || error.message);

    // Send appropriate error response
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.post("/home", (req, res) => {
  console.log("Redirecting POST /home to POST /create-workspace");
  res.redirect(307, "/create-workspace"); // Temporary redirect with the same method
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

