const express = require("express");
const router = express.Router();

const { signUp, login } = require("../controllers/authController");

const authMiddleware = require("../middlewares/authMiddleware");

router.get("/profile", authMiddleware, (req, res) => {
        res.json({
            userId: req.userId
        });
    }
);

router.post("/signup", signUp);
router.post("/login", login);

module.exports = router;