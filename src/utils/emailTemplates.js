/**
 * Generates the HTML template for OTP verification email
 * @param {string} otp - The 6-digit OTP
 * @returns {string} HTML string for the email body
 */
export const getOtpTemplate = (otp) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SkillBridge OTP Verification</title>
</head>

<body style="margin:0;padding:0;background:#000000;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:40px 0;">
    <tr>
        <td align="center">

            <table width="600" cellpadding="0" cellspacing="0"
                style="background:#111111;border:1px solid #2a2a2a;border-radius:16px;overflow:hidden;">

                <!-- Header -->
                <tr>
                    <td align="center" style="padding:45px 30px 30px;">
                        <h1 style="margin:0;color:#ffffff;font-size:34px;font-weight:bold;">
                            SkillBridge
                        </h1>

                        <p style="margin-top:12px;color:#9f9f9f;font-size:15px;">
                            Secure Email Verification
                        </p>
                    </td>
                </tr>

                <!-- Divider -->
                <tr>
                    <td>
                        <div style="height:1px;background:#2d2d2d;"></div>
                    </td>
                </tr>

                <!-- Content -->
                <tr>
                    <td style="padding:45px 45px 20px;color:#ffffff;">

                        <h2 style="margin-top:0;font-size:28px;">
                            Verify Your Email
                        </h2>

                        <p style="color:#bdbdbd;font-size:16px;line-height:28px;">
                            Welcome to <strong style="color:#ffffff;">SkillBridge</strong>.
                            Use the verification code below to continue.
                        </p>

                        <!-- OTP -->
                        <div style="text-align:center;margin:40px 0;">

                            <div style="
                                display:inline-block;
                                padding:18px 42px;
                                background:#ffffff;
                                color:#000000;
                                font-size:38px;
                                font-weight:bold;
                                letter-spacing:10px;
                                border-radius:12px;">
                                ${otp}
                            </div>

                        </div>

                        <p style="color:#bdbdbd;font-size:15px;line-height:26px;">
                            This verification code is valid for
                            <strong style="color:#ffffff;">15 minutes</strong>.
                        </p>

                        <p style="color:#777777;font-size:14px;line-height:24px;">
                            If you didn't request this code, you can safely ignore this email.
                        </p>

                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td style="padding:30px;border-top:1px solid #2d2d2d;text-align:center;">

                        <p style="margin:0;color:#777777;font-size:13px;">
                            © 2026 SkillBridge. All Rights Reserved.
                        </p>

                        <p style="margin-top:10px;color:#555555;font-size:12px;">
                            This is an automated email. Please do not reply.
                        </p>

                    </td>
                </tr>

            </table>

        </td>
    </tr>
</table>

</body>
</html>
`;
