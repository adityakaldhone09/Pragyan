import { Router } from "express";

import {
  recommendCareer
}
from "../controllers/aiController";

const router = Router();

router.post(
  "/recommend-career",
  recommendCareer
);

export default router;
