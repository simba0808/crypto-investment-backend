
const emailTemplate = (email) => {
    return `

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Email Verification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f6f6f6;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        h1 {
            font-size: 24px;
            margin-bottom: 20px;
            text-align: center;
        }
        p {
            margin-bottom: 20px;
        }
        .verification-code {
            font-size: 28px;
            font-weight: bold;
            text-align: center;
            color: #007bff;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #007bff;
            color: #ffffff;
            text-decoration: none;
            border-radius: 4px;
        }
        .button:hover {
            background-color: #0056b3;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Hi, ${email}</h1>
        <h5>Thank you for signing up! Please use the verification code below to verify your email. This code will be valid only for 2 minutes.</h5>
        <p class="verification-code">${process.env.VERIFICATION_CODE}</p>
        <h5>If you have any questions, simply reply to this email. I’m here to help.</h5>
        <h4>Regards,<br>Profit Team</h4> 
    </div>
</body>
</html>


`};

export default emailTemplate;

