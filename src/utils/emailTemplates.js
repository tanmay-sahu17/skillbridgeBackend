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

<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr>
        <td align="center">

            <table width="600" cellpadding="0" cellspacing="0"
                style="background:#0d0d0d;border:1px solid #262626;border-radius:16px;overflow:hidden;">

                <!-- Header / Logo -->
                <tr>
                    <td align="center" style="padding:45px 30px 25px;">
                        <table cellpadding="0" cellspacing="0">
                            <tr>
                                <td valign="middle" style="padding-right:10px;">
                                    <svg width="26" height="26" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                        <defs>
                                            <linearGradient id="logoGrad" x1="100%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stop-color="#5a5a5a"/>
                                                <stop offset="55%" stop-color="#9a9a9a"/>
                                                <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
                                            </linearGradient>
                                        </defs>
                                        <polygon points="68,4 96,40 62,96 30,60" fill="url(#logoGrad)"/>
                                    </svg>
                                </td>
                                <td valign="middle">
                                    <span style="font-size:22px;font-weight:bold;color:#ffffff;">
                                        Skill<span style="color:#9f9f9f;font-weight:bold;">Bridge</span>
                                    </span>
                                </td>
                            </tr>
                        </table>

                        <p style="margin-top:14px;color:#9f9f9f;font-size:14px;">
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

                        <h2 style="margin-top:0;font-size:26px;font-weight:bold;">
                            Verify Your Email
                        </h2>

                        <p style="color:#bdbdbd;font-size:15px;line-height:26px;">
                            Welcome to <strong style="color:#ffffff;">SkillBridge</strong> —
                            the campus collaboration platform. Use the code below to continue.
                        </p>

                        <!-- OTP -->
                        <div style="text-align:center;margin:35px 0;">
                            <div style="
                                display:inline-block;
                                padding:16px 40px;
                                background:#1a1a1a;
                                border:1px solid #333333;
                                color:#ffffff;
                                font-size:34px;
                                font-weight:bold;
                                letter-spacing:10px;
                                border-radius:12px;">
                                ${otp}
                            </div>
                        </div>

                        <p style="color:#bdbdbd;font-size:14px;line-height:24px;">
                            This code is valid for <strong style="color:#ffffff;">15 minutes</strong>.
                        </p>

                        <p style="color:#6b6b6b;font-size:13px;line-height:22px;">
                            If you didn't request this code, you can safely ignore this email.
                        </p>

                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td style="padding:28px;border-top:1px solid #2d2d2d;text-align:center;">
                        <p style="margin:0;color:#6b6b6b;font-size:12px;">
                            © 2026 SkillBridge. All Rights Reserved.
                        </p>
                        <p style="margin-top:8px;color:#4a4a4a;font-size:11px;">
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
