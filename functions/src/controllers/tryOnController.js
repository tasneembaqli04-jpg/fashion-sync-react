const {generateTryOn} = require("../services/tryOnService");

async function tryOnController(request, response) {
  try {
    const {product, imageUrl} = request.body || {};

    if (!product || !imageUrl) {
      return response.status(400).json({
        success: false,
        message: "product and imageUrl are required",
      });
    }

    const result = await generateTryOn(product, imageUrl);

    return response.status(200).json(result);
  } catch (error) {
    console.error("Try On controller error:", error);

    return response.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

module.exports = {
  tryOnController,
};