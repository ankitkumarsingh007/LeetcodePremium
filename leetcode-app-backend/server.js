const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const uri =
  "mongodb+srv://snghankitkumar:XFPoVUAS8OpSizlv@cluster0.98kbcpo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose
  .connect(uri)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Define a schema and model for questions
const questionSchema = new mongoose.Schema({
  ID: String,
  Title: String,
  Acceptance: String,
  Difficulty: String,
  Frequency: String,
  "Leetcode Question Link": String,
  Done: Boolean,
});

const Question = mongoose.model("Question", questionSchema);

// Routes
app.get("/questions", async (req, res) => {
  try {
    const questions = await Question.find();
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/questions", async (req, res) => {
  const question = new Question(req.body);
  try {
    const newQuestion = await question.save();
    res.status(201).json(newQuestion);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put("/questions/:id", async (req, res) => {
  const { Done } = req.body;
  if (typeof Done !== "boolean") {
    return res.status(400).json({ message: "Invalid data format" });
  }

  try {
    const updatedQuestion = await Question.findOneAndUpdate(
      { ID: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedQuestion) {
      return res.status(404).json({ message: "Question not found" });
    }
    res.json(updatedQuestion);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
