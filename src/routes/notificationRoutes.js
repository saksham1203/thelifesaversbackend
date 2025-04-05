const express = require("express");
const router = express.Router();
const {
  saveToken,
  sendToUser,
  broadcast,
} = require("../controllers/notificationController");

router.post("/save-token", saveToken);
router.post("/send", sendToUser);
router.post("/broadcast", broadcast);

module.exports = router;
