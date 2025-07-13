const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");  // to use -> bcrypt.compare() function
const jwt = require("jsonwebtoken");  // to use -> jwt.sign() function
const mailSender = require("../utils/mailSender");
const Profile = require("../models/Profile");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
require("dotenv").config()  // to use -> process.env.JWT_SECRET


//Send OTP
exports.sendotp = async (req, res) => {

    try {
        // fetch email from request ki body
        const { email } = req.body;

        //check if user already exist
        const checkUserPresent = await User.findOne({ email });

        //if user already exist , then return a response
        if (checkUserPresent) {
            return res.status(401).json({
                success: false,
                message: "User already registered",
            })
        }

        // user pahle se exist nhi karta to ham otp generate karenge
        // generate otp
        var otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });
        console.log("OTP generated successfully");

        //check unique otp or not
        //check untill unique otp  will get
        let result = await OTP.findOne({ otp: otp });
        while (result) {
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            });
            result = await OTP.findOne({ otp: otp });
        }

        // now unique otp has got, make payload 
        // Entry in DB to check when user enters
        // create object
        const otpPayload = { email, otp };

        //create an entry in db for OTP and insert the Payload
        const otpBody = await OTP.create(otpPayload);
        console.log(otpBody);

        //return response successful
        res.status(200).json({
            success: true,
            message: "OTP Sent Successfully",
            otp,
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        })

    }


}

//Signup
exports.signup = async (req, res) => {
    try {
        //data fetch from request ki body
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp,
        } = req.body;

        //validate the data
        if (!firstName || !lastName || !email || !password || !confirmPassword || !otp) {
            return res.status(403).json({
                success: false,
                message: "All fields are required",
            })
        }

        // dono password match karlo
        if (password != confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Password and ConfirmPassword value does not match, please try again",
            });
        }

        //check user already exist or not
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User is already registered",
            });
        }

        //find most recent OTP stored in the DB for the User
        const recentOtp = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);
        console.log(recentOtp);

        //validate OTP
        if (recentOtp.length === 0) {
            //OTP not found for the email
            return res.status(400).json({
                success: false,
                message: "OTP NOT Found",
            })
        } else if (otp !== recentOtp[0].otp) {  //otp -> entered otp , recentOtp.otp -> db stored otp (((BOTH SHOULD BE SAME)))
            //Invalid OTP
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            })
        }

        // Hash the Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // entry create in DB

        const ProfileDetails = await Profile.create({
            gender: null,
            dateOfBirth: null,
            about: null,
            contactNumber: null,
        })

        const user = await User.create({
            firstName,
            lastName,
            email,
            accountType,
            contactNumber,
            password: hashedPassword,
            additionalDetails: ProfileDetails._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`, // this api from dicebear is make a dp image with first letter of firstName and lastName (eg-> Ashish Maurya -> AM)
        })

        //return response
        return res.status(200).json({
            success: true,
            message: 'User is registered(Sign Up) Successfully',
            user,
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "User cannot be registered. Please try again",
        })
    }
}

//Login
exports.login = async (req, res) => {
    try {
        // get data from req body
        const { email, password } = req.body;

        //validation data
        if (!email || !password) {
            return res.status(403).json({
                success: false,
                message: "All fields are required, please try again",
            });
        }

        //user check exist or not
        const user = await User.findOne({ email }).populate("additionalDetails"); // no need of populate here
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User is not registered, Please signup first",
            });
        }

        //generate JWT, after password matching
        if (await bcrypt.compare(password, user.password)) { // match the password entered in input ->password, and password available in user -> user.password
            const payload = {
                email: user.email,
                id: user._id,
                accountType: user.accountType,
            }
            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: "2h",
            });
            user.token = token;
            user.password = undefined;

            //create cookie and send response 
            const options = {
                expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),// 3 days
                httpOnly: true,
                secure: process.env.NODE_ENV === "production", // true in production (HTTPS)
                sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // none for cross-origin, lax for dev
            }
            res.cookie("token", token, options).status(200).json({
                success: true,
                token,
                user,
                message: "Logged in successfully",
            })

        } else {
            return res.status(401).json({
                success: false,
                message: "Password is incorrect",
            })
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Login Failure, Please try again",
        });
    }
}

//Change Password
//TODO : HOMEWORK
exports.changePassword = async (req, res) => {
    try {
        //get user data from req.user
        const userDetails = await User.findById(req.user.id);

        // get old password, new password, and confirm new password from req.body
        const { oldPassword, newPassword } = req.body;

        // Validate old password
        const isPasswordMatch = await bcrypt.compare(oldPassword, userDetails.password);

        if (!isPasswordMatch) {
            // if old password does not match, return a 401 (unauthorized) error
            return res.status(401).json({
                success: false,
                message: "The password is incorrect",
            });
        }

        // Match new password and confirm new password
        if (newPassword !== confirmNewPassword) {
            // return a 400 (Bad Request) error
            return res.status(400).json({
                success: false,
                message: "The password and confirm password does not match",
            });
        }

        // update password
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        const updatedUserDetails = await User.findByIdAndUpdate(
            req.user.id,
            { password: encryptedPassword },
            { new: true },
        );

        // send notification email
        try {
            const emailResponse = await mailSender(
                updatedUserDetails.email,
                passwordUpdated(
                    updatedUserDetails.email,
                    `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
                )
            );
            console.log("Email sent successfully: ", emailResponse.response);

        } catch (error) {
            // If there's an error sending email, log the error and return a 500 (Internal Server Error) error
            console.error("Error occured while sending email: ", error);
            return res.status(500).json({
                success: false,
                message: "Error occured while sending"
            });
        }

        // Return success response
        return res.status(200).json({
            success: true,
            message: "Password updated successfully",
        })

    } catch (error) {
        console.error("Error occured while updating password: ", error);
        return res.status(500).json({
            success: false,
            message: "Error occurred while updating password",
            error: error.message,
        });
    }

};