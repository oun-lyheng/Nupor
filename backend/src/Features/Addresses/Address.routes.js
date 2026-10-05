const express = require("express");
const router = express.Router();
const {
  getAddressesController,
  addAddressController,
  updateAddressController,
  setDefaultAddressController,
  deleteAddressController,
} = require("./Address.controller");
const { authenticateToken } = require("../../middlewares/authenticate");

// All address routes are authenticated
router.use(authenticateToken);

router.get("/addresses", getAddressesController);
router.post("/addresses", addAddressController);
router.put("/addresses/:id", updateAddressController);
router.patch("/addresses/:id/default", setDefaultAddressController);
router.delete("/addresses/:id", deleteAddressController);

module.exports = router;
