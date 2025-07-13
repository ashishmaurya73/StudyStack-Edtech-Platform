const Category = require("../models/Category");
const { Mongoose } = require("mongoose");

function getRandomInt(max) {
    return Math.floor(Math.random() * max)
}

//create Category ka handler function

exports.createCategory = async (req, res) => {
    try {
        //fetch data
        const { name, description } = req.body;

        // validation
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // create entry in DB
        const categorysDetails = await Category.create({
            name: name,
            description: description,
        });
        console.log(categorysDetails);

        //return response
        return res.status(200).json({
            success: true,
            message: "Category Created Successfully",
        });


    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// getAllcategories handler function

exports.showAllCategories = async (req, res) => {
    try {
        const allCategories = await Category.find({}); // sabhi Categories leke aao jisme name and description ho
        return res.status(200).json({
            success: true,
            data: allCategories,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

// categoryPageDetails
exports.categoryPageDetails = async (req, res) => {
    try {
        // get categoryId
        const { categoryId } = req.body;

        // Get course for the specified category
        const selectedCategory = await Category.findById(categoryId)
            .populate({
                path: "courses",
                match: { status: "Published" },
                populate: "ratingAndReviews",
            }).exec();
        console.log("Selected Category: ", selectedCategory);
        console.log("Selected Category Negation: ", !selectedCategory);

        // Validation
        // Handle the case when the category is not found
        if (!selectedCategory) {
            console.log("Category not found.");
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        // Handle the case when there are no courses
        if (selectedCategory.courses.length === 0) {
            console.log("No courses found for the selected category.");
            return res.status(404).json({
                success: false,
                message: "No courses found for the selected category.",
            });
        }

        // get courses for different/other categories
        const categoriesExceptSelected = await Category.find({
            _id: { $ne: categoryId },  //ne -> not equal, get the data of all category whose id is not equal to categoryId
        })
        let differentCategory = await Category.findOne(
            categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]
                ._id
        )
            .populate({
                path: "courses",
                match: { status: "Published" },
            })
            .exec();

        // get top 10 selling courses across all categories
        const allCategories = await Category.find()
            .populate({
                path: "courses",
                match: { status: "Published" },
                populate: {
                    path: "instructor",
                },
            })
            .exec()

        const allCourses = allCategories.flatMap((category) => category.courses)
        const mostSellingCourses = allCourses
            .sort((a, b) => b.sold - a.sold)
            .slice(0, 10)
        console.log("most Selling Courses: ", mostSellingCourses)

        // return response
        return res.status(200).json({
            success: true,
            data: {
                selectedCategory,
                differentCategory,
                mostSellingCourses,
            },
        })


    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server error",
            error: error.message,
        })
    }
}