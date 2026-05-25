import express
from "express";

import {
  recommendCareer
}
from "../controllers/aiController";

const router =
express.Router();

router.post(
  "/recommend-career",
  recommendCareer
);

export default router;