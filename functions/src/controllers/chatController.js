const {
  handleChatMessage,
} = require("../services/chatOrchestratorService");

async function chatController(request, response) {
  try {
    const {
      message,
      history,
      currentOutfit,
      currentOutfitImage,
    } = request.body || {};

    if (
      !message ||
      typeof message !== "string" ||
      !message.trim()
    ) {
      return response.status(400).json({
        success: false,
        message: "message is required",
      });
    }

    let textStreamStarted = false;

    function startTextStream() {
      if (textStreamStarted) {
        return;
      }

      response.status(200);
      response.setHeader(
        "Content-Type",
        "text/plain; charset=utf-8"
      );
      response.setHeader("Cache-Control", "no-cache");

      textStreamStarted = true;
    }

    const result = await handleChatMessage({
      message: message.trim(),
      history: Array.isArray(history) ? history : [],
      currentOutfit: Array.isArray(currentOutfit)
        ? currentOutfit
        : [],
        
      currentOutfitImage:
        typeof currentOutfitImage === "string"
        ? currentOutfitImage
        : "",
      onChunk: (text) => {
        if (!text) {
          return;
        }
        console.log(
          "CHAT CONTROLLER WRITING CHUNK:",
          String(text)
        );

        startTextStream();
        response.write(String(text));
      },
    });

    if (
      result?.responseMode === "IMAGE" &&
      result?.imageGenerated === true &&
      result?.image?.dataUrl
    ) {

      if (textStreamStarted) {
        console.error(
          "Cannot return image after text streaming started."
        );

        return response.end();
      }

      return response.status(200).json({
        success: true,
        responseMode: "IMAGE",
        imageGenerated: true,
        image: {
          mimeType:
            result.image.mimeType || "image/png",
          dataUrl: result.image.dataUrl,
        },
        products: result.products || [],
        intent: result.intent || null,
      });
    }
    console.log(
      "CHAT CONTROLLER ENDING TEXT STREAM:",
      textStreamStarted
    );

    if (textStreamStarted) {
      return response.end();
    }

    if (
      result?.responseMode === "IMAGE" &&
      result?.imageGenerated === false
    ) {
      return response.status(500).json({
        success: false,
        responseMode: "IMAGE",
        imageGenerated: false,
        error:
          result.error || "IMAGE_GENERATION_FAILED",
        products: result.products || [],
      });
    }

    return response.status(200).json({
      success: true,
      responseMode: "TEXT",
      message: "",
    });
  } catch (error) {
    console.error("Chat controller error:", error);

    if (!response.headersSent) {
      return response.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }

    return response.end();
  }
}

module.exports = {
  chatController,
};