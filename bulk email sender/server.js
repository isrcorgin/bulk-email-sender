const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const port = 3000;

// Middleware to parse JSON request bodies and form data
app.use(bodyParser.json());
app.use(express.static('public'));

// Configure multer to handle file uploads
const upload = multer({ dest: 'uploads/' });

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Email sending route with attachment handling
app.post('/send-emails', upload.single('attachment'), async (req, res) => {
    const emails = JSON.parse(req.body.emails); // Parse emails string to array
    const senderEmail = req.body.senderEmail;
    const senderPassword = req.body.senderPassword;
    const subject = req.body.subject;
    const message = req.body.message; // This will now be treated as HTML
    const attachment = req.file;

    try {
        // Configure transporter with sender email and password
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: senderEmail, // Dynamic sender email
                pass: senderPassword, // Dynamic sender password
            }
        });

        // Create the mail options
        let mailOptions = {
            from: `"Director" <${senderEmail}>`,
            subject: subject,
            html: message, // Use HTML instead of plain text
        };

        // If there's an attachment, add it to the email
        if (attachment) {
            mailOptions.attachments = [
                {
                    filename: attachment.originalname,
                    path: attachment.path,
                }
            ];
        }

        // Send emails to each address
        for (let email of emails) {
            mailOptions.to = email.trim(); // Add recipient
            await transporter.sendMail(mailOptions); // Send email
            console.log(`Email sent successfully to ${email}`);
        }

        // Remove the uploaded file after sending
        if (attachment) {
            fs.unlinkSync(attachment.path); // Delete the file from server
        }

        res.json({ message: "Emails sent successfully!" });
    } catch (error) {
        console.error("Error sending emails:", error);
        res.status(500).json({ message: "Error sending emails", error });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
