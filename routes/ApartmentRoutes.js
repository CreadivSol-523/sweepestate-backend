import express from "express"
import { handleAddApartment, handleGetApartment } from "../controllers/ApartmentController.js";
import { CreateUploadMiddleware } from "../middlewares/MulterMiddleware.js";


const router = express.Router();


router.post("/create-seller/:sellerId", CreateUploadMiddleware([{ name: "image", isMultiple: false }, { name: "featuredImages", isMultiple: true }]), handleAddApartment)


router.get("/:buyerId/property-listing", handleGetApartment)


export default router;