const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

module.exports.Createreview=async (req, res) => {
    let { id } = req.params;

    let listing = await Listing.findById(id);

    if (!listing) {
      throw new ExpressError(404, "Listing not found");
    }

    let newReview = new Review(req.body.review);
    newReview.author = req.user._id; // 🔥 important

    await newReview.save();

    listing.reviews.push(newReview._id);
    await listing.save();

    req.flash("success", "New Review Created!!");
    res.redirect(`/listings/${id}`);
  };
module.exports.destroyreview=async (req, res) => {
    let { id, reviewId } = req.params;

    await Listing.findByIdAndUpdate(id, {
      $pull: { reviews: reviewId },
    });

    await Review.findByIdAndDelete(reviewId);

    req.flash("success", "Review Deleted!!");
    res.redirect(`/listings/${id}`);
  };