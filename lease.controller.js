import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { Cycle } from "../models/cycle.model.js";
import { Lease } from "../models/lease.model.js";
import mongoose from "mongoose";
import { toggleCycleStatus } from "./user.controller.js";

const createLease = asyncHandler(async (req, res) => {
  const { lenderId, borrowerId, cycleId } = req.body;

  const userCycle = await Cycle.findById(cycleId);

  await Cycle.findByIdAndUpdate(cycleId, {
    $set: {
      isActive: !userCycle.isActive,
    },
  });

  const existedLease = await Lease.findOne({ lender: lenderId });

  if (existedLease) {
    throw apiError(400, "This cycle already has an active lease.");
  }

  const newLease = await Lease.create({
    lender: lenderId,
    borrower: borrowerId,
  });

  const createdLease = await Lease.findById(newLease._id);

  if (!createdLease) {
    throw apiError(500, "Failed to create lease.");
  }

  res.status(201).json(201, createdLease, "Lease created successfully.");
});

export { createLease };
