const RatingAndReview = require("../models/RatingAndReview");
const Course = require('../models/Course');

// createRating
exports.createRating = async (req, res) => {
    try {
        // get user id 
        const userId = req.user.id;
        console.log("userId: ", userId)
        
        // fetch data from req body
        const {courseId, rating, review } = req.body;
        console.log("courseId: ", courseId)

        // check if user is enrolled or not
        const courseDetails = await Course.findOne({
            _id: courseId,
            studentsEnrolled: { $elemMatch: { $eq: userId } }, // check userId iss courseId ke ander padi hai ki nhi
        });
        console.log("courseDetails: ", courseDetails)

        if (!courseDetails) {
            return res.status(404).json({
                success: false,
                message: "Student is not enrolled in the course",
            })
        }

        // check if user already reviewed the course
        const alreadyReviewed = await RatingAndReview.findOne({
            user: userId,
            course: courseId,
        });

        if (alreadyReviewed) {
            return res.status(403).json({
                success: false,
                message: "course is already reviewed by the user",
            });
        }

        // create rating and review
        const ratingReview = await RatingAndReview.create({
            rating, review,
            course: courseId,
            user: userId,
        });

        // update course with this rating/review
        const updatedCourseDetails = await Course.findByIdAndUpdate({ _id: courseId },
            {
                $push: {
                    ratingAndReviews: ratingReview._id,
                }
            },
            { new: true });

        console.log(updatedCourseDetails);

        // return response
        return res.status(200).json({
            success: true,
            message: "Rating and Review created successfully",
            ratingReview,
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}


// getAverageRating
exports.getAverageRating = async (req, res) => {
    try {
        // get course ID
        const courseId = req.body.courseId;

        // calculate avg rating
        const result = await RatingAndReview.aggregate([
            {// RatingAndReview ke ander ek aisi entry findout karke do jis entry ke ander course key ke ander courseId wali entry padi ho
                $match: {
                    course: new mongoose.Types.ObjectId(courseId),
                },
            },
            {
                $group: {
                    _id: null,// All entry wrapped in single group
                    averageRating: { $avg: "$rating" },
                }
            }
        ])
        // return rating
        if (result.length > 0) {
            return res.status(200).json({
                success: true,
                averageRating: result[0].averageRating,
            })
        }

        // if no review/rating exist
        return res.status(200).json({
            success: true,
            message: "Average Rating is 0, no ratings given till now",
            averageRating: 0,
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}



// getAllRatingAndReviews

exports.getAllRating = async (req, res) => {
    try {
        const allReviews = await RatingAndReview.find({})
            .sort({ rating: "desc" }) // sort in descending order on the basis of rating
            .populate({
                path: "user",
                select: "firstName lastName email image",  // only those will populate which are written in the select
            })
            .populate({
                path: "course",
                select: "corseName",
            })
            .exec();
        
        return res.status(200).json({
            success:true,
            message:"All reviews fetched successfully",
            data:allReviews,
        })


    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}
