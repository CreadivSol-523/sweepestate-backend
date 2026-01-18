import express from "express";
import { handleAcceptMatch, handleGetMatches, handleReqMatch } from "../controllers/MatchController.js";


const router = express.Router();


router.post("/:userId/match-property/:propertyId", handleReqMatch);

router.get("/:userId/get-matches", handleGetMatches);

router.patch("/:userId/accept-matches/:matchId", handleAcceptMatch);

export default router