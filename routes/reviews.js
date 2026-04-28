const express = require("express");
const router = express.Router({ mergeParams: true });

const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");

const Review = require("../models/review.js");
const Listing = require("../models/listing.js");

const { validateReview, isLoggedIn, isReviewAuthor } = require("../middleware.js");

const reviewController=require("../controllers/review.js");

// CREATE REVIEW
router.post(  "/",  isLoggedIn,  validateReview,  wrapAsync(reviewController.Createreview));

// DELETE REVIEW (SECURED)
router.delete(  "/:reviewId",  isLoggedIn,  isReviewAuthor,wrapAsync(reviewController.destroyreview));

module.exports = router;