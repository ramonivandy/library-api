const { Router } = require("express");
const router = Router();
const historyController = require("../modules/historyController");

router.get("/history", historyController.getAll);
router.get("/history/:id", historyController.getSingle);

module.exports = router;
