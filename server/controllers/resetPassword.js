const User=require("../models/User");
const mailSender=require("../utils/mailSender");
const bcrypt=require("bcrypt");
const crypto=require("crypto");

//resetPasswordToken -> ye email bhejne ka kam karega
exports.resetPasswordToken = async(req, res)=>{
    try{
        //get email from req body
        const email=req.body.email;

        //check user for this email, email validation
        const user=await User.findOne({email:email});
        if(!user){
            return res.json({
                success:false,
                message:`Your Email ${email} is not registered with us`,
            });
        }

        //generate token
        const token=crypto.randomUUID();

        // update user by adding token and expiration time
        const updatedDetails=await User.findOneAndUpdate(
            {email:email},  // search based on email
            {
                token:token,  // new generated token insert in userDetails
                resetPasswordExpires: Date.now() + 5*60*1000,
            },
            {new:true} // return update document in the response
        );
        // DB entry created

        // create url (frontend ka url hai)
        const url = `http://localhost:5173/update-password/${token}` // token ki value change hoti jayegi aur diff-diff url(link) bante rahenge

        // send mail containing the url
        await mailSender(email, "Password Reset Link", `Password Reset Link: ${url}`)

        // return response
        return res.json({
            success:true,
            message:"Email sent successfully, please check email and change password",
        })

        }catch(error){
            console.log(error);
            return res.json({
                success:false,
                message:"Something went wrong while sending reset password mail"
            })
        }

}


//resetPassword  -> ye db me password change karega

exports.resetPassword=async(req, res)=>{
    try{
        // data fetch
        const {password, confirmPassword, token}=req.body;  // frontend ne token ko body me dala hai, jisko hm yha req body ke ander se extract kr sakte hai

        // validation
        if(password !==confirmPassword){
            return res.json({
                success:false,
                message:"Password are not match with confirmPassword",
            })
        }

        // get User Details from DB using token
        const userDetails=await User.findOne({token: token}); // fetch userdetails based on token

        // if no entry -> invalid token
        if(!userDetails){
            return res.json({
                success:false,
                message:"Token is invalid",
            })
        }

        // token time check expire or not
        if(userDetails.resetPasswordExpires < Date.now()){
            return res.json({
                success:false,
                message:"Token is expired, please regenerate your token",
            });
        }

        // hash the password
        const hashedPassword=await bcrypt.hash(password, 10);

        // password update
        await User.findOneAndUpdate(
            {token:token}, // token used as a search parameter to update password
            {password:hashedPassword}, // password updated
            {new:true},
        )

        // return response 
        return res.json({
            success:true,
            message:"Password reset successful",
        })

    }catch(error){
        return res.json({
            success:false,
            error:error.message,
            message:`Some error in updating the password`,
        })
    }
}