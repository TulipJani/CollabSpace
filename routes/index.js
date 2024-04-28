const express = require("express");
const session = require("express-session");
const auth = require("../log_auth/auth");
const fs = require("fs");
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

app.use(express.static("public"));

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
    
    const userWorkspaces = await Workspace.find({ createdBy: displayName });
    res.render("home", { displayName,userWorkspaces });
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

app.get('/workspace/:workspaceName/:username', async (req, res) => {
 const { workspaceName, username } = req.params;
 try {
    const user = await Glog.findOne({ displayName: username });
    if (!user) {
      return res.status(404).send('User not found');
    }

    const woe = await Workspace.findOne({ workspaceName, user: user._id });

    res.render('workspace', { woe, workspaceName, username });
 } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
 }
});



app.post('/workspace/:workspaceName/:username', async (req, res) => {
  const { email } = req.body;
  const { workspaceName,username } = req.params;
  
  try {
    const workspace = await Workspace.findOne({ workspaceName });
    if (!workspace) {
      return res.status(404).send("Workspace not found");
    }

    if (workspace.inviteMembers.includes(email)) {
      return res.status(400).send("Email already invited to this workspace");
    }

    // Add the invited member's email to inviteMembers array
    workspace.inviteMembers.push(email);
    await workspace.save();

    

    // Send email invitation to the invited member
    sendEmailInvitation(email, workspaceName,username);

    res.send("Invitation sent successfully");
  } catch (error) {
    console.error("Error inviting member:", error);
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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.export = app;
