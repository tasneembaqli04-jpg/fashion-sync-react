const { sendOrderCancellationEmail } = require("../services/orderCancellationEmailService");

async function orderCancellationEmailController(request, response) {
  try {
    const { toEmail, orderId, total } = request.body || {};

    if (!toEmail) {
      return response.status(400).json({
        success: false,
        message: "toEmail is required",
      });
    }

    const result = await sendOrderCancellationEmail({ toEmail, orderId, total });

    return response.status(200).json({
      success: true,
      emailId: result.emailId,
    });
  } catch (error) {
    console.error("Order cancellation email controller error:", error);

    return response.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

module.exports = {
  orderCancellationEmailController,
};