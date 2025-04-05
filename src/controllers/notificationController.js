const admin = require("../config/firebaseAdmin");
const Token = require("../models/Token");

exports.saveToken = async (req, res) => {
  const { token, userId } = req.body;

  if (!token) return res.status(400).json({ error: "Token required" });

  try {
    await Token.updateOne({ token }, { token, userId }, { upsert: true });
    res.status(200).json({ message: "Token saved" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save token" });
  }
};

exports.sendToUser = async (req, res) => {
  const { token, title, body } = req.body;

  const message = {
    notification: { title, body },
    token,
  };

  try {
    const response = await admin.messaging().send(message);
    res.status(200).json({ success: true, response });
  } catch (err) {
    res.status(500).json({ success: false, error: err });
  }
};

exports.broadcast = async (req, res) => {
  const { title, body } = req.body;

  try {
    const tokens = (await Token.find()).map((t) => t.token);

    const messages = tokens.map((token) => ({
      notification: { title, body },
      token,
    }));

    const response = await admin.messaging().sendEach(messages);
    res.status(200).json({ success: true, response });
  } catch (err) {
    res.status(500).json({ error: "Broadcast failed", details: err });
  }
};
