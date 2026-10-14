import { createResource, deleteResource } from "./lifecycle_service.js";
import Benefit from "../models/benefit.js";

// create a new benefit
const createBenefit = (values) => createResource("benefit", values);

// get all benefits
const getBenefits = async (query = {}, sort = { createdAt: -1 }) => {
  // get benefits by query
  const benefits = await Benefit.find(query).sort(sort);
  return benefits;
};

// get a single benefit By Id
const getBenefitById = async (id) => {
  const benefit = await Benefit.findById(id);
  return benefit;
};

// update a benefit
const updateBenefit = async (id, benefit) => {
  const updatedBenefit = await Benefit.findByIdAndUpdate(id, benefit, {
    new: true,
    runValidators: true,
  });
  return updatedBenefit;
};

// delete a benefit
const deleteBenefit = (id, user) =>
  deleteResource("benefit", { _id: id, ...(user ? { user } : {}) });

export default {
  createBenefit,
  getBenefits,
  getBenefitById,
  updateBenefit,
  deleteBenefit,
};
