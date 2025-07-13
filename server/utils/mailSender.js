const nodemailer=require("nodemailer");
require("dotenv").config();

const mailSender=async(email, title, body)=>{
    try{
        // create Transppoter
        let transporter=nodemailer.createTransport({
            host:process.env.MAIL_HOST,
            port:process.env.MAIL_PORT,
            auth:{
                user:process.env.MAIL_USER,
                pass:process.env.MAIL_PASS,
            }
        })

        // Send mail
        let info=await transporter.sendMail({
            // from:`"StudyStack || Techmarval - by Ashish Maurya" <${process.env.MAIL_USER}>`,
            from:"StudyStack",
            to:`${email}`,
            subject:`${title}`,
            html:`${body}`,
        })
        console.log(info);
        return info;

    }catch(error){
        console.log(error.message);
    }
}

module.exports=mailSender;