import Benefit from "../models/benefit.js";

// create a new benefit
const createBenefit = async (benefit) => {
  try {
    const newBenefit = new Benefit(benefit);
    const savedBenefit = await newBenefit.save();
    return savedBenefit;
  } catch (error) {
    throw new Error(error.message);
  }
};

// get all benefits
const getBenefits = async (query = {}) => {
  try {
    // get benefits by query
    const benefits = await Benefit.find(query);
    return benefits;
  } catch (error) {
    throw new Error(error.message);
  }
};

// get a single benefit By Id
const getBenefitById = async (id) => {
  try {
    const benefit = await Benefit.findById(id);
    return benefit;
  } catch (error) {
    throw new Error(error.message);
  }
};

// update a benefit
const updateBenefit = async (id, benefit) => {
  try {
    const updatedBenefit = await Benefit.findByIdAndUpdate(id, benefit, {
      new: true,
    });
    return updatedBenefit;
  } catch (error) {
    throw new Error(error.message);
  }
};

// delete a benefit
const deleteBenefit = async (id) => {
  try {
    const deletedBenefit = await Benefit.findByIdAndDelete(id);
    return deletedBenefit;
  } catch (error) {
    throw new Error(error.message);
  }
};

export default {
  createBenefit,
  getBenefits,
  getBenefitById,
  updateBenefit,
  deleteBenefit,
};
