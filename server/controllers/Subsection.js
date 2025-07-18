const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

// create Subsection for given section
exports.createSubSection = async (req, res) => {
    try {
        // fetch necessary data from req body
        const { sectionId, title, description } = req.body;

        // extract file/video
        const video = req.files.video;

        // validation
        if (!sectionId || !title || !video || !description) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // upload video to cloudinary and get url of that video from it
        const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);

        // create a sub section with necessary information
        const SubSectionDetails = await SubSection.create({
            title: title,
            timeDuration: `${uploadDetails.duration}`,
            description: description,
            videoUrl: uploadDetails.secure_url,
        })

        // update the corresponding section with the newly created sub-section
        const updatedSection = await Section.findByIdAndUpdate({ _id: sectionId },
            {
                $push: {
                    subSection: SubSectionDetails._id,
                }
            },
            { new: true }
        ).populate("subSection");

        // return the updated section in the response
        return res.status(200).json({
            success: true,
            message: "Sub section created successfully",
            updatedSection,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
}

// HOMEWORK: update subsection

exports.updateSubSection = async (req, res) => {
    try {
        const { subSectionId, sectionId, title, description } = req.body;
        const subSection = await SubSection.findById(subSectionId);

        if (!subSection) {
            return res.status(404).json({
                success: false,
                message: "SubSection not found",
            })
        }
        if (title !== undefined) {
            subSection.title = title
        }
        if (description !== undefined) {
            subSection.description = description
        }
        if (req.files && req.files.video !== undefined) {
            const video = req.files.video
            const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME)
            subSection.videoUrl = uploadDetails.secure_url
            subSection.timeDuration = `${uploadDetails.duration}`
        }

        await subSection.save();

        // find updated section and return it
        const updatedSection = await Section.findById(sectionId).populate("subSection");

        console.log("updated section", updatedSection);

        return res.json({
            success: true,
            message: "Section updated successfully",
            data: updatedSection,
        })


    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            message: "An error occured while updating the section",
        })
    }
}

// HOMEWORK: delete subsection

exports.deleteSubSection = async (req, res) => {
    try {
        const { subSectionId, sectionId } = req.body;
        await Section.findByIdAndUpdate(
            { _id: sectionId },
            {
                $pull: {
                    subSection: subSectionId,
                },
            }
        )
        const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId})
        if (!subSection) {
            return res.status(404).json({
                success: false,
                message: "SubSection not found",
            })
        }

        const updatedSection = await Section.findById(sectionId).populate("subSection");

        return res.json({
            success: true,
            message: "SubSection deleted successfully",
            data: updatedSection
        })

    } catch (Error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            message: "An error occured while deleting the SubSection"
        })
    }
}