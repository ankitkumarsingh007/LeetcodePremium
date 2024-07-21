const mongoose = require("mongoose");
const fs = require("fs");
const csv = require("csv-parser");

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
  Done: { type: Boolean, default: false },
});

const Question = mongoose.model("Question", questionSchema);

// Read and parse questions from CSV file
const questions = [];

fs.createReadStream("questions.csv")
  .pipe(csv())
  .on("data", (row) => {
    questions.push({
      ID: row.ID,
      Title: row.Title,
      Acceptance: row.Acceptance,
      Difficulty: row.Difficulty,
      Frequency: row.Frequency,
      "Leetcode Question Link": row["Leetcode Question Link"],
      Done: false, // Set default value to false
    });
  })
  .on("end", async () => {
    try {
      await Question.insertMany(questions);
      console.log("Questions have been inserted into the database");
      mongoose.connection.close();
    } catch (err) {
      console.error("Error inserting questions into the database:", err);
    }
  })
  .on("error", (err) => {
    console.error("Error reading the CSV file:", err);
  });
