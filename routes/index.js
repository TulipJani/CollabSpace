const express = require("express");
const session = require("express-session");
const auth = require("../log_auth/auth");
const fs = require("fs");
const cors=require('cors');
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
const io=new Server(server);
io.on('connection',socket=>{
  console.log(socket,"connected")
})

app.use(express.static("public"));
app.use(cors());
app.use(session({ secret: "cats" }));
app.use(passport.initialize());
app.use(passport.session());
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "hacknuthon@gmail.com",
    pass: "ymmr skfn fozs uaki",
  },
});

app.get("/home", isLoggedIn, async (req, res) => {
  const { displayName, email } = req.user;
  const guser = new Glog({
    displayName,
    email,
  });

  try {
   
    await guser.save();
    sendCongratulatoryEmail(email);
    
   const workspaces = await Workspace.find({ createdBy: displayName });

    res.render("home", { displayName,workspaces });
  } catch (error) {
    console.error("Error in /home route:", error);
    res.status(500).send("Internal Server Error");
  }
});


app.post("/home", async (req, res) => {
  const { displayName } = req.user;

  const { workspaceName } = req.body;

  try {
    // Create a new workspace document
    const newWorkspace = new Workspace({
      workspaceName,createdBy: displayName
    });
    await newWorkspace.save();
    username=displayName;
    res.redirect(`/workspace/${workspaceName}/${username}`);
  } catch (error) {
    console.error("Error saving workspace:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.delete('/home', async (req, res) => {
  try {
    const { workspaceName } = req.body;
    if (!workspaceName) {
      return res.status(400).json({ error: 'Workspace name is required.' });
    }
    // Find the workspace by name and delete it
    const deletedWorkspace = await Workspace.deleteOne({ name: workspaceName }); 
    if (deletedWorkspace.deletedCount === 0) {
      return res.status(404).json({ error: 'Workspace not found.' });
    }
    res.sendStatus(200); // Send success status
  } catch (err) {
    console.error("Error deleting workspace:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

function sendCongratulatoryEmail(userEmail) {
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
    } else {
      console.log("Email sent:", info.response);
    }
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

      // If inviteMembers is null or undefined, initialize it as an empty array
      if (!workspace.inviteMembers) {
          workspace.inviteMembers = [];
      }

      if (req.method === 'POST') {
          const { email } = req.body;

          if (workspace.inviteMembers.includes(email)) {
              return res.status(400).send("Email already invited to this workspace");
          }

          workspace.inviteMembers.push(email);
          await workspace.save();
          sendEmailInvitation(email, workspaceName, username);
          io.to(workspaceName).emit('invite', { workspaceName, email });


          return res.redirect(`/workspace/${workspaceName}/${username}`);
      }

      res.render('workspace', { workspace, workspaceName, username });
  } catch (error) {
      console.error("Error handling workspace request:", error);
      res.status(500).send("Internal Server Error");
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

io.on("connection",(socket)=>{
  console.log("user connected");
});

app.get("/auth", (req, res) => {
  res.render("googleAuth");
});
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);
app.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: "/home",
    failureRedirect: "/auth/fail",
  })
);
app.get("/auth/fail", (req, res) => {
  res.send("SOmething went wrong");
});


app.get("/logout", (req, res) => {
  req.logOut();
  req.session.destroy();
  res.send("Goodbye");
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.export = app;
