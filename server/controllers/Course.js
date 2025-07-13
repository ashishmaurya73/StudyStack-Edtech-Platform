const Category = require("../models/Category");
const Course = require("../models/Course");
const User = require("../models/User");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const CourseProgress = require("../models/CourseProgress");
const { convertSecondsToDuration } = require("../utils/secToDuration");


// Function to create a new course
// createCourse handler function
exports.createCourse = async (req, res) => {
  try {

    // Get user ID from request object
    const userId = req.user.id; // userId user ke ander se nikala hai jo hamne Auth.js wale controller ke ander payload ke ander user me dala tha


    // fetch data
    let {
      courseName,
      courseDescription,
      whatYouWillLearn,
      price,
      tag,
      category,
      status,
      instructions,
    } = req.body;

    // get thumbnail image from request files
    const thumbnail = req.files.thumbnailImage;


    // data validation
    if (!courseName ||
      !courseDescription ||
      !whatYouWillLearn ||
      !price ||
      !tag ||
      !thumbnail ||
      !category
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      })
    }

    if (!status || status === undefined) {
      status = "Draft"
    }

    // check for instructor
    const instructorDetails = await User.findById(userId, {
      accountType: "Instructor",
    }); //instructor ka data find kiya hai by userId

    console.log("Instructor Details: ", instructorDetails);
    //TODO: verify that userId and instructorDetails._id are same or different ?

    if (!instructorDetails) {
      return res.status(404).json({
        success: false,
        message: "Instructor Details not found",
      });
    }

    // check given tag is valid or not
    const categoryDetails = await Category.findById(category);
    if (!categoryDetails) {
      return res.status(404).json({
        success: false,
        message: "Tag Details not found",
      })
    }

    // Upload the Thumbnail (Image) to Cloudinary
    const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME);

    // create an entry for new Course OORR create a new course with the given details
    const newCourse = await Course.create({
      courseName,
      courseDescription,
      instructor: instructorDetails._id,
      whatYouWillLearn: whatYouWillLearn,
      price,
      tag: tag,
      category: categoryDetails._id,
      thumbnail: thumbnailImage.secure_url,
      status: status,
      instructions: instructions,
    })

    // add the new course to the user schema of instructor
    await User.findByIdAndUpdate(
      { _id: instructorDetails._id },// aisa User jiski entry iss id se match kr rahi hai wo user hamme mill gya
      {
        $push: {
          courses: newCourse._id,
        }
      },
      { new: true },
    );


    //TODO: HOMEWORK ->completed
    // Add the new course to the Categories
    await Category.findByIdAndUpdate(
      { _id: category },
      {
        $push: {
          courses: newCourse._id,
        },
      },
      { new: true }
    );


    // return response
    // Return the new course and a success message
    return res.status(200).json({
      success: true,
      message: "Course Created Successfully",
      data: newCourse,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create courses",
      error: error.message,
    })
  }
};


exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.body

    // Find the course
    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    // Unenroll students from the course
    const studentsEnrolled = course.studentsEnrolled
    for (const studentId of studentsEnrolled) {
      await User.findByIdAndUpdate(studentId, {
        $pull: { courses: courseId },
      })
    }

    // Delete sections and sub-sections
    const courseSections = course.courseContent
    for (const sectionId of courseSections) {
      // Delete sub-sections of the section
      const section = await Section.findById(sectionId)
      if (section) {
        const subSections = section.subSection
        for (const subSectionId of subSections) {
          await SubSection.findByIdAndDelete(subSectionId)
        }
      }

      // Delete the section
      await Section.findByIdAndDelete(sectionId)
    }

    // Delete the course
    await Course.findByIdAndDelete(courseId)

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}


exports.editCourse = async (req, res) => {
  try {
    const updates = req.body;
    const courseId = updates.courseId;
    // console.log("COURSE ID:", courseId);
    // console.log("JAI MATA DI!!!******************************************")
    // console.log("updates:", updates);
    
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // If Thumbnail Image is found, update it
    if (req.files) {
      console.log("thumbnail update");
      const thumbnail = req.files.thumbnailImage;
      const thumbnailImage = await uploadImageToCloudinary(
        thumbnail,
        process.env.FOLDER_NAME
      );
      course.thumbnail = thumbnailImage.secure_url;
    }

    // Combined condition for updates check
    if (updates && typeof updates === 'object') {
      for (const key in updates) {
        if (Object.prototype.hasOwnProperty.call(updates, key)) {
          if (key === "tag" || key === "instructions") {
            course[key] = JSON.parse(updates[key]);
          } else {
            course[key] = updates[key];
          }
        }
      }
    }

    await course.save();

    const updatedCourse = await Course.findOne({
      _id: courseId,
    })
      .populate({
        path: "instructor",
        populate: {
          path: "additionalDetails",
        },
      })
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec();

    res.json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


// getAllCourses handler function
// Get Course List
exports.getAllCourses = async (req, res) => {
  try {
    const allCourses = await Course.find(
      { status: "Published" },
      {
        courseName: true,
        price: true,
        thumbnail: true,
        instructor: true,
        ratingAndReviews: true,
        studentsEnrolled: true,
      }
    )
      .populate("instructor")
      .exec()

    return res.status(200).json({
      success: true,
      data: allCourses,
    })
  } catch (error) {
    console.log(error)
    return res.status(404).json({
      success: false,
      message: `Can't Fetch Course Data`,
      error: error.message,
    })
  }
}

// getCourseDetails
exports.getCourseDetails = async (req, res) => {
  try {
    // get id
    const { courseId } = req.body;
    // find course details
    const courseDetails = await Course.findOne({ _id: courseId }).populate(
      {
        path: "instructor",
        populate: {
          path: "additionalDetails",
        },
      }
    )
      .populate("category")
      // .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
          // select: "-videoUrl",
        },
      })
      .exec();

    // Validation
    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find the course with ${courseId}`,
      })
    }

    let totalDurationInSeconds = 0
    courseDetails.courseContent.forEach((content) => {
      content.subSection.forEach((subSection) => {
        const timeDurationInSeconds = parseInt(subSection.timeDuration)
        totalDurationInSeconds += timeDurationInSeconds
      })
    })

    const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

    // return response                                                        
    return res.status(200).json({
      success: true,
      message: "Course details fetched successfully",
      data: {
        courseDetails,
        totalDuration,
      }
    })

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}


exports.getFullCourseDetails = async (req, res) => {
  try {

    const { courseId } = req.body;
    console.log("COURSE ID ON BACKEND:\n", courseId);
    const userId = req.user.id
    console.log("user id", req.user.id)
    const courseDetails = await Course.findOne({
      _id: courseId,
    })
      .populate({
        path: "instructor",
        populate: {
          path: "additionalDetails",
        },
      })
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec()

    let courseProgressCount = await CourseProgress.findOne({
      courseID: courseId,
      userId: userId,
    })

    console.log("courseProgressCount : ", courseProgressCount)

    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find course with id: ${courseId}`,
      })
    }

    // if (courseDetails.status === "Draft") {
    //   return res.status(403).json({
    //     success: false,
    //     message: `Accessing a draft course is forbidden`,
    //   });
    // }

    let totalDurationInSeconds = 0
    courseDetails.courseContent.forEach((content) => {
      content.subSection.forEach((subSection) => {
        const timeDurationInSeconds = parseInt(subSection.timeDuration)
        totalDurationInSeconds += timeDurationInSeconds
      })
    })

    const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

    return res.status(200).json({
      success: true,
      data: {
        courseDetails,
        totalDuration,
        completedVideos: courseProgressCount?.completedVideos
          ? courseProgressCount?.completedVideos
          : [],
      },
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,

    })
  }
}

// Get a list of Course for a given Instructor 
exports.getInstructorCourses = async (req, res) => {
  try {
    // Get the instructor ID from the authenticated user or request body
    const instructorId = req.user.id

    // Find all courses belonging to the instructor
    const instructorCourses = await Course.find({
      instructor: instructorId,
    }).sort({ createdAt: -1 })

    // Return the instructor's courses
    res.status(200).json({
      success: true,
      data: instructorCourses,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: "Failed to retrieve instructor courses",
      error: error.message,
    })
  }
}