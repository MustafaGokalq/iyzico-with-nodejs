const router = require("express").Router()
const {AddPayment,cardList, cardSave, cardDelete} = require("./controller")


router.post("/payment",AddPayment);

router.post("/payment-card-list", cardList);

router.post("/payment-card-save", cardSave);

router.post("/payment-card-delete", cardDelete);

module.exports = router;