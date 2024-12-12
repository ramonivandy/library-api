const { Router } = require("express");
const router = Router();
const transaksiController = require("../modules/transaksiController");

router.get("/transaksi", transaksiController.getAll);
router.get("/transaksi/:id", transaksiController.getSingle);
router.post("/transaksi", transaksiController.post);
router.put("/transaksi/:id_transaksi/return", transaksiController.returnBooks);

module.exports = router;
