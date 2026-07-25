const {
  generateVirtualTryOn,
} = require("../services/virtualTryOnService");

async function tryOnV2Controller(request, response) {
  try {
    if (request.method !== "POST") {
      return response.status(405).json({
        success: false,
        message: "Method not allowed. Use POST.",
      });
    }

    const {product, imageUrl} = request.body || {};

    if (!imageUrl) {
      return response.status(400).json({
        success: false,
        message: "Customer image is required.",
      });
    }

    if (!product?.img) {
      return response.status(400).json({
        success: false,
        message: "Product image is required.",
      });
    }

    const result = await generateVirtualTryOn({
      personImageUrl: imageUrl,
      productImageUrl: product.img,
      product,
    });

    return response.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("tryOnV2Controller error:", error);

    return response.status(500).json({
      success: false,
      message: error.message || "Virtual Try-On generation failed.",
    });
  }
}

module.exports = {
  tryOnV2Controller,
};