// Import the necessary modules here
import nodemailer from "nodemailer";

export const sendWelcomeEmail = async (user) => {
  // Write your code here
  const transporter = nodemailer.createTransport({
    service: process.env.SMPT_SERVICE,
    auth: {
      user: process.env.STORFLEET_SMPT_MAIL,
      pass: process.env.STORFLEET_SMPT_MAIL_PASSWORD,
    },
  });

  const mainOptions = {
    from: process.env.STORFLEET_SMPT_MAIL,
    to: user.email,
    subject: "Welcome to StoreFleet",
    html: `<div style="font-family: Arial; padding:20px;">
        
        <div style="text-align:center;">
          <img 
            src="https://files.codingninjas.in/logo1-32230.png" 
            width="120"
          />
          
          <h1>Welcome to StoreFleet</h1>
        </div>

        <p>Hello ${user.name},</p>

        <p>
          Thank you for registering with StoreFleet.
        </p>

        <p>
          We are excited to have you onboard.
        </p>

        <p>
          Happy Shopping 
        </p>

      </div>`,
  };
  await transporter.sendMail(mainOptions);
};
