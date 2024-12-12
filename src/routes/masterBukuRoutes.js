const { Router } = require("express");
const router = Router();
const masterBukuController = require("../modules/masterBukuController");

router.get("/master/buku", masterBukuController.getAll);
router.get("/master/buku/:id", masterBukuController.getSingle);
router.post("/master/buku", masterBukuController.post);
router.put("/master/buku/:id", masterBukuController.update);
router.delete("/master/buku/:id", masterBukuController.del);

module.exports = router;
