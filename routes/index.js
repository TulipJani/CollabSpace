const express = require("express");
const session = require("express-session");
const auth = require("../log_auth/auth");
const fs = require("fs");
const Workspace = require("../models/workspace");
const nodemailer = require("nodemailer");

const passport = require("passport");
function isLoggedIn(req, res, next) {
  req.user ? next() : res.sendStatus(401);
}
const bodyParser = require("body-parser");
const collection = require("../models/config");
const Project = require("../models/user");
const path = require("path");
const multer = require("multer");
const Asset = require("../models/obj");
const Member = require("../models/member");
const Glog = require("../models/log_auth");
const app = express();

app.use(express.static("public"));

app.use(session({ secret: "cats" }));
app.use(passport.initialize());
app.use(passport.session());
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/assign", async (req, res) => {
  const projects = await Project.find();
  res.render("assign", { projects });
});

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
    const projects = await Project.find();
    res.render("home", { displayName, projects });
  } catch (error) {
    console.error("Error in /home route:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/home", async (req, res) => {
  // Retrieve workspace name from request body
  const { workspaceName } = req.body;

  try {
    // Create a new workspace document
    const newWorkspace = new Workspace({
      workspaceName,
    });

    // Save the new workspace document to the database
    await newWorkspace.save();

    res.send("Workspace created successfully");
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

app.get("/assign", async (req, res) => {
  const projects = await Project.find();
  res.render("assign", { projects });
});
app.post("/assign", async (req, res) => {
  try {
    const { title, description, startDate, endDate } = req.body;

    const project = new Project({
      title,
      description,
      startDate,
      endDate,
    });

    // Save the project to the database
    await project.save();
    const projects = await Project.find();
    res.redirect("/assign");
  } catch (error) {
    console.error("Error saving project:", error);
    res.status(500).send("Internal Server Error");
  }
});
app.get("/members", (req, res) => {
  res.render("member");
});

app.post("/members", async (req, res) => {
  try {
    const { numOfRepetitions } = req.body;
    const savedMembers = [];

    // Loop through each member submitted in the form
    for (let i = 0; i < numOfRepetitions; i++) {
      const memberName = req.body[`project_title_${i}`];
      const memberPosition = req.body[`project_description_${i}`];
      const taskToAssign = req.body[`task_to_assign_${i}`];
      const startDate = req.body[`start_date_${i}`];
      const endDate = req.body[`end_date_${i}`];

      // Create a new member document
      const newMember = new Member({
        memberName,
        memberPosition,
        taskToAssign,
        startDate,
        endDate,
      });

      // Save the member document to the database
      const savedMember = await newMember.save();
      savedMembers.push(savedMember);
      console.log("Member saved:", savedMember);
    }

    // Send a response after all members have been saved
    res
      .status(200)
      .json({ message: "Members saved successfully", members: savedMembers });
  } catch (err) {
    console.error("Error saving member data:", err);
    // Send a JSON response with the error message
    res.status(500).json({
      error: "Failed to save member data to database",
      details: err.message,
    });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
});
app.get("/assets", async (req, res) => {
  try {
    const assets = await Asset.find(); // Corrected from 'asset' to 'Asset'
    res.render("assets", { assets });
  } catch (error) {
    console.error("Error fetching assets:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/assets", upload.single("filename"), async (req, res) => {
  try {
    const { filename, path, size } = req.file;
    const asset = new Asset({
      filename,
      path,
      size,
    });
    await asset.save();
    res.send("Asset uploaded successfully");
  } catch (error) {
    res.status(400).send("Error uploading asset");
  }
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

app.get("/workspace", (req, res) => {
  res.render("workspace");
});
app.get("/logout", (req, res) => {
  req.logOut();
  req.session.destroy();
  res.send("Goodbye");
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.export = app;
