import { Router } from "express";
import { createStreamChannel, createVideoInvite, getOrder, listOrders } from "../controllers/orderController.js";

const router = Router()

router.get("/",listOrders)
router.get("/:id",getOrder)
router.get("/:id",getOrder)
router.get("/:id/stream-channel",createStreamChannel)
router.get("/:id/video-invite",createVideoInvite)
export default router