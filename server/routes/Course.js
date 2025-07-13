// Import the required modules
const express =require("express")
const router=express.Router()

// Import the Controllers

// Course Controllers Import
const {
    createCourse,
    editCourse,
    getInstructorCourses,
    getFullCourseDetails,
    deleteCourse,
    getAllCourses,
    getCourseDetails,
} = require("../controllers/Course");

const {
    updateCourseProgress
}=require("../controllers/courseProgress");

// Categories Controllers Import
const {
    showAllCategories,
    createCategory,
    categoryPageDetails,
}=require("../controllers/Category");

// importing Section Controllers
const {
    createSection,
    updateSection,
    deleteSection,
}=require("../controllers/Section");

// importing Subsection constrollers
const {
    createSubSection,
    updateSubSection,
    deleteSubSection,
}=require("../controllers/Subsection");

// importing RatingAndReview controllers
const {
    createRating,
    getAverageRating,
    getAllRating,
}=require("../controllers/RatingAndReview");

// Importing Middlewares
const {auth, isInstructor, isStudent, isAdmin}=require("../middlewares/auth");

// ***********************************************************************
//                          COURSE ROUTES
// ***********************************************************************

// Courses can only be created by Instructors
router.post("/createCourse", auth, isInstructor, createCourse);
// Edit Course
router.post("/editCourse", auth, isInstructor, editCourse);

// Delete Course
router.delete("/deleteCourse", auth, isInstructor, deleteCourse);
// Instructor Courses
router.get("/getInstructorCourses", auth, isInstructor, getInstructorCourses);
// Get All courses Details
router.post("/getFullCourseDetails", auth, getFullCourseDetails);
// Add a Section to a Course
router.post("/addSection", auth, isInstructor, createSection);
// Update a section
router.post("/updateSection", auth, isInstructor, updateSection);
// Delete a Section
router.post("/deleteSection", auth, isInstructor, deleteSection);
// Edit Sub Section
router.post("/updateSubSection", auth, isInstructor, updateSubSection);
// Delete Sub Section
router.post("/deleteSubSection", auth, isInstructor, deleteSubSection);
// Add a Sub Section to a Section
router.post("/addSubSection", auth, isInstructor, createSubSection);
// Get all Registered Courses
router.get("/getAllCourses", getAllCourses);
// Get Details for a Specific Courses
router.post("/getCourseDetails", getCourseDetails);

router.post("/updateCourseProgress", auth, isStudent, updateCourseProgress);

// ***********************************************************************
//                          Category routes (Only by Admin)
// ***********************************************************************

// Category can only be created by Admin
// TODO: Put IsAdmin Middleware here
router.post("/createCategory", auth, isAdmin, createCategory);
router.get("/showAllCategories", showAllCategories);
router.post("/getCategoryPageDetails", categoryPageDetails);

// ***********************************************************************
//                          Rating and Review
// ***********************************************************************

router.post("/createRating", auth, isStudent, createRating);
router.get("/getAverageRating", getAverageRating);
router.get("/getReviews", getAllRating);

module.exports=router