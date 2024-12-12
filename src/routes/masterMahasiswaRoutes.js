const { Router } = require("express");
const router = Router();
const masterMahasiswaController = require("../modules/masterMahasiswaController");

router.get("/master/mahasiswa", masterMahasiswaController.getAll);
router.get("/master/mahasiswa/:id", masterMahasiswaController.getSingle);
router.post("/master/mahasiswa", masterMahasiswaController.post);
router.put("/master/mahasiswa/:id", masterMahasiswaController.update);
router.delete("/master/mahasiswa/:id", masterMahasiswaController.del);

module.exports = router;
