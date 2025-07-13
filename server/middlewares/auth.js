const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");

//auth
exports.auth = async (req, res, next) => {
    try {
        //extract token
        const token = req.cookies.token || req.body.token || req.header("Authorization").replace("Bearer ", "");

        // if token missing, then return response
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Token is missing",
            })
        }

        //verify the token
        try {
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            console.log(decode);
            req.user = decode; // storing the decoded JWT payload in the request object for further use
        } catch (error) {
            // if any issue in verification
            return res.status(401).json({
                success:false,
                message:"Token is invalid"
            })
        }
        next();  // if JWT iv valid, move on to the next middleware or request handler

    } catch (error) {
        return res.status(401).json({
            success:false,
            message:"Something went wrong while validating the token",
        })
    }
}

//isStudent
exports.isStudent= async(req, res, next)=>{
    try{
        if(req.user.accountType !== "Student"){
            return res.status(401).json({
                success:false,
                message:"This is a protected route for Students only",
            });
        }
        next();
    }catch(error){
        return res.status(500).json({
            success:false,
            message:"User role cannot be verified, Please try again",
        })
    }
}

//isInstructor
exports.isInstructor= async(req, res, next)=>{
    try{
        if(req.user.accountType !== "Instructor"){
            return res.status(401).json({
                success:false,
                message:"This is a protected route for Instructors only",
            });
        }
        next();
    }catch(error){
        return res.status(500).json({
            success:false,
            message:"User role cannot be verified, Please try again",
        })
    }
}

//isAdmin
exports.isAdmin= async(req, res, next)=>{
    try{
        if(req.user.accountType !== "Admin"){
            return res.status(401).json({
                success:false,
                message:"This is a protected route for Admin only",
            });
        }
        next();
    }catch(error){
        return res.status(500).json({
            success:false,
            message:"User role cannot be verified, Please try again",
        })
    }
}