import ExtractRelativeFilePath from "../middlewares/ExtractRelativePath.js";
import ApartmentModel from "../models/ApartmentSchema.js";
import BuyerModel from "../models/BuyerSchema.js";
import SellerModel from "../models/SellerSchema.js";
import SearchQuery from "../utils/SearchQuery.js";


export const handleAddApartment = async (req, res, next) => {
    try {

        const { sellerId } = req.params;

        const {
            title,
            type,
            location,
            price,
            area,
            bedrooms,
            bathrooms,
            floor,
            furnished,
            balcony,
            parking,
            amenities,
            availability,
            featured,
            description
        } = req.body;

        const image = req?.files?.image?.[0];
        const featuredImages = req?.files?.featuredImages;

        if (!image) {
            return res.status(404).json({ message: "image is required" })
        }

        if (!Array.isArray(featuredImages)) {
            return res.status(404).json({ message: "Featured Image should be an array" })
        }

        if (featuredImages.length === 0) {
            return res.status(400).json({ message: "Atleast 1 featured image is required" })
        }

        const extractImage = ExtractRelativeFilePath(image);
        const extractFeaturedImage = featuredImages.map((i) => ExtractRelativeFilePath(i))

        const findSeller = await SellerModel.findById(sellerId);
        if (!findSeller) {
            return res.status(404).json({ message: "Seller Not Found" })
        }

        const createListing = new ApartmentModel({
            sellerId: sellerId,
            title,
            type,
            location,
            price,
            area,
            bedrooms,
            bathrooms,
            floor,
            furnished,
            balcony,
            parking,
            amenities,
            availability,
            featured,
            description,
            image: extractImage,
            featuredImages: extractFeaturedImage
        })
        await createListing.save()

        res.status(200).json({ message: "Apartment Has Been Listed Successfully" })

    } catch (error) {
        console.log(error);
        next(error)
    }
}

export const handleGetApartment = async (req, res, next) => {
    try {

        const { buyerId } = req.params;

        const findBuyer = await BuyerModel.findById(buyerId);
        if (!findBuyer) {
            return res.status(404).json({ message: "Buyer Not Found" })
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const search = req.query.search || {};
        const matchStage = SearchQuery(search);

        const pipeline = [
            {
                $lookup: {
                    from: "sellers",
                    let: { sellerId: "$sellerId" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", "$$sellerId"] }
                            }
                        },
                        {
                            $project: {
                                password: 0,
                                sessions: 0,
                                __v: 0
                            }
                        }
                    ],
                    as: "seller"
                }
            },
            {
                $unwind: {
                    path: "$seller",
                    preserveNullAndEmptyArrays: true
                }
            }
        ];

        if (matchStage) pipeline.push(matchStage);
        pipeline.push({ $sort: { createdAt: -1 } });
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit });

        const apartments = await ApartmentModel.aggregate(pipeline);

        const countPipeline = [];
        if (matchStage) countPipeline.push(matchStage);
        countPipeline.push({ $count: "totalItems" });

        const countResult = await ApartmentModel.aggregate(countPipeline);
        const totalItems = countResult.length > 0 ? countResult[0].totalItems : 0;
        const totalPages = Math.ceil(totalItems / limit);

        res.status(200).json({
            apartments,
            meta: {
                totalItems,
                totalPages,
                page,
                limit,
            },
        });

    } catch (error) {
        console.log(error);
        next(error)
    }
}