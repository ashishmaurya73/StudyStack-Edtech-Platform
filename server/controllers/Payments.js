const mongoose = require("mongoose");
const { instance } = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const { courseEnrollmentEmail } = require("../mail/templates/courseEnrollmentEmail");
const crypto = require("crypto");
const { paymentSuccessEmail } = require("../mail/templates/paymentSuccessEmail");
const CourseProgress = require("../models/CourseProgress");

// capture the payment and initiate the Razorpay order -> create order for multiple items buy
exports.capturePayment = async (req, res) => {

    console.log("Req Body:", req.body);
    console.log("Req User:", req.user); 
    // get courses and UserID
    const { courses } = req.body;
    const userId = req.user.id;

    // validation
    // valid courses
    if (courses.length === 0) {
        return res.json({
            success: false,
            message: "Please provide valid course Id",
        })
    }

    // valid courseDetail
    let totalAmount = 0;
    console.log(courses);
    for (const course_id of Object.values(courses)) {
        let course;
        try {
            course = await Course.findById(course_id);
            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: "could not find the course",
                });
            }

            // user already pay for the same course
            const uid = new mongoose.Types.ObjectId(userId); // userId jo pahle string type me thi wo convert ho gayi object type ke aander
            if (course.studentsEnrolled.includes(uid)) {
                return res.status(200).json({
                    success: false,
                    message: "Student is already enrolled",
                });
            }

            totalAmount += course.price;

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }


    // Creating options to create order
    // const amount = course.price;
    // const currency = "INR";

    const options = {
        amount: totalAmount * 100,
        currency: "INR",
        receipt: Math.random(Date.now()).toString(),
        // notes: {    // payment authorisation ke bad bachche ko course me enroll karte time use hoga
        //     courseId: course_id,
        //     userId,
        // }
    };

    try {
        // initiate the payment using razorpay
        const paymentResponse = await instance.orders.create(options);
        console.log(paymentResponse);

        // return response
        return res.json({
            success: true,
            data: paymentResponse
        })
        // return res.status(200).json({
        //     success: true,
        //     courseName: course.courseName,
        //     courseDescription: courseDescription,
        //     thumbnail: course.thumbnail,
        //     orderId: paymentResponse.id,
        //     currency: paymentResponse.currency,
        //     amount: paymentResponse.amount,
        // })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Could not initiate order",
        });
    }

};

// Verify Signature of Razorpay and Server OORR verify the payment

exports.verifyPayment = async (req, res) => {
    const razorpay_order_id = req.body?.razorpay_order_id;
    const razorpay_payment_id = req.body?.razorpay_payment_id;
    const razorpay_signature = req.body?.razorpay_signature;
    const courses = req.body?.courses;
    const userId = req.user.id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courses || !userId) {
        return res.status(404).json({
            success: false,
            message: "payment failed",
        })
    }

    let body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET)
        .update(body.toString())
        .digest("hex");
    if (expectedSignature === razorpay_signature) {
        // enroll the student
        await enrollStudents(courses, userId, res);
        // return response
        return res.status(200).json({
            success: true,
            message: "Payment Verified",
        })
    }

    return res.status(200).json({
        success: false,
        message: "Payment Failed"
    })
}

const enrollStudents = async (courses, userId, res) => {
    // first append user id in all courses then append course id in user's courses
    if (!courses || !userId) {
        return res.status(400).json({
            success: false,
            message: "Please Provide data for courses"
        })
    }

    for (const courseId of Object.values(courses)) {
        try {
            const enrolledCourse = await Course.findOneAndUpdate(
                { _id: courseId },
                { $push: { studentsEnrolled: userId } },
                { new: true },
            );

            if (!enrolledCourse) {
                return res.status(500).json({
                    success: false,
                    message: "Course Not Found"
                })
            }

            const courseProgress = await CourseProgress.create({
                courseID: courseId,
                userId: userId,
                completedVideos: [],
            })

            // find the student and add the course to their list of courses
            const enrolledStudent = await User.findByIdAndUpdate(userId, {
                $push: {
                    courses: courseId,
                    courseProgress: courseProgress._id,
                }
            }, { new: true });

            // Send mail to the student

            const emailResponse = await mailSender(
                enrolledStudent.email,
                `Successfully enrolled into ${enrolledCourse.courseName}`,
                courseEnrollmentEmail(enrolledCourse.courseName, `${enrolledStudent.firstName}`)
            );

            console.log("Email Sent Successfully", emailResponse.response);

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                success: false,
                message: error.message,
            })
        }
    }
}

// for sending the email
exports.sendPaymentSuccessEmail = async (req, res) => {
    const { orderId, paymentId, amount } = req.body;
    const userId = req.user.id;

    if (!orderId || !paymentId || !amount || !userId) {
        return res.status(400).json({
            success: false,
            message: "Please provide all the fields"
        })
    } //find student data with the userId

    try {
        const enrolledStudent = await User.findById(userId);
        await mailSender(
            enrolledStudent.email,
            `Payment Received`,
            paymentSuccessEmail(`${enrolledStudent.firstName}`, amount / 100, orderId, paymentId)
        )

    } catch (error) {
        console.log("error in sending mail", error);
        return res.status(500).json({
            success: false,
            message: "Could not send email"
        })
    }

}

// exports.verifySignature = async (rea, res) => {

//     const webhookSecret = "123456789"; // ye server pe pada hoga

//     const signature = req.headers["x-razorpay-signature"]; // ye hm request me se nikale hai jo ki razorpay ne send kiya hai

//     const shasum = crypto.createHmac("sha256", webhookSecret);
//     shasum.update(JSON.stringify(req.body));
//     const digest = shasum.digest("hex");

//     if (signature === digest) {
//         console.log("Payment is Authorised");

//         const { courseId, userId } = req.body.payload.payment.entity.notes;

//         try {
//             // fulfill the action

//             // find the course and enroll the student in it
//             const enrolledcourse = await Course.findOneAndUpdate(
//                 { _id: courseId },
//                 { $push: { studentsEnrolled: userId } },
//                 { new: true },
//             );

//             if (!enrolledcourse) {
//                 return res.status(500).json({
//                     success: false,
//                     message: "Course not found",
//                 });
//             }

//             console.log(enrolledcourse);

//             // find the student and add the course to their list of enrolled courses
//             const enrolledStudent = await User.findOneAndUpdate(
//                 { _id: userId },
//                 { $push: { courses: courseId } },
//                 { new: true },
//             );
//             console.log(enrolledStudent);

//             // mail send krdo confirmation wala
//             const emailResponse = await mailSender(
//                 enrolledStudent.email,
//                 "Congratulations from Codehelp",
//                 "Congratulations, you are onboarded into new Codehelp course"
//             );

//             console.log(emailResponse);
//             return res.status(200).json({
//                 success: true,
//                 message: "signature verified and course added"
//             })

//         } catch (error) {
//             return res.status(500).json({
//                 success: false,
//                 message: error.message,
//             })
//         }

//     } else {
//         return res.status(400).json({
//             success: false,
//             msaage: "Invalid Request",
//         })
//     }

// }

