const Message = require("../models/Message");

// Retrieve chat history
exports.getChatHistory = async (req, res) => {
  try {
    console.log("Fetching chat history...");
    const messages = await Message.find().sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error retrieving chat history:", error.message);
    res.status(500).json({ message: "Failed to retrieve messages." });
  }
};

// Save a new message to the database
exports.saveMessage = async (messageData) => {
  try {
    console.log("Saving message:", messageData);
    const newMessage = new Message(messageData);
    await newMessage.save();
    console.log("Message saved successfully");
  } catch (error) {
    console.error("Failed to save message:", error.message);
  }
};
