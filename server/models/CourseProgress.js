const mongoose = require("mongoose");

const courseProgress = new mongoose.Schema({
    courseID: {
        type: mongoose.Schema.Types.ObjectId,
        required:true,
        ref: "Course",
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    },
    completedVideos: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SubSection",
        }
    ]
})

module.exports = mongoose.model("CourseProgress", courseProgress);