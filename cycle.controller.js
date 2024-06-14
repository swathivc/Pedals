import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Cycle } from "../models/cycle.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

const uploadCycleDetails = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new apiError(401, "User not logged in.");
  }

  const { model, rentRate } = req.body;

  console.log("Cycle model: ", model); // TBR
  console.log("Cycle rent rate: ", rentRate); // TBR

  if (!model) {
    throw new apiError(400, "Model is required.");
  }

  const cycleImagelocalPath = req.file?.path;

  console.log("Cycle imae local path: ", cycleImagelocalPath); // TBR

  if (!cycleImagelocalPath) {
    throw new apiError(400, "Cycle imae local path not found.");
  }

  const image = await uploadToCloudinary(cycleImagelocalPath);

  if (!image) {
    throw new apiError(400, "Could not upload cycle image to cloudinary.");
  }

  const cycle = await Cycle.create({
    model,
    owner: req.user._id,
    rentRate: rentRate ? rentRate : 0,
    image: image.url,
  });

  const createdCycleInstance = await Cycle.findById(cycle._id);

  if (!createdCycleInstance) {
    throw new apiError(500, "Could not upload cycle details.");
  }

  res
    .status(201)
    .json(
      new apiResponse(
        200,
        createdCycleInstance,
        "Cycle details uploaded successfully."
      )
    );
});

const getCycles = asyncHandler(async (req, res) => {
  const { endTime, landmark, cycleType } = req.body;

  console.log("End time: ", endTime); // TBR
  console.log("Landmark: ", landmark); // TBR
  console.log("Cycle type: ", cycleType); // TBR

  if ([endTime, landmark, cycleType].some((field) => field?.trim === "")) {
    throw new apiError(400, "All fields are required.");
  }

  const cycles = await Cycle.aggregate([
    {
      $match: {
        isActive: false,
        cycleType: cycleType,
        landmark: landmark,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              _id: 1,
              fullName: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $arrayElemAt: ["$owner", 0],
        },
      },
    },
  ]);

  if (!cycles) {
    throw new apiError(500, "Could not fetch cycles.");
  }

  res
    .status(200)
    .json(new apiResponse(200, cycles, "Cycles fetched successfully."));
});

const getCycleById = asyncHandler(async (req, res) => {
  const { cycleId } = req.params;

  if (!cycleId) {
    throw new apiError(400, "Cycle ID is required.");
  }

  const cycle = await Cycle.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(cycleId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              _id: 1,
              fullName: 1,
              avatar: 1,
              phoneNumber: 1,
              email: 1,
              upiId: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $arrayElemAt: ["$owner", 0],
        },
      },
    },
  ]);

  if (!cycle) {
    throw new apiError(500, "Could not fetch cycle details.");
  }

  res
    .status(200)
    .json(new apiResponse(200, cycle, "Cycle details fetched successfully."));
});

export { uploadCycleDetails, getCycles, getCycleById };
