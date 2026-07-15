const { streamChatReply } = require("../services/chatService");

async function chatController(request, response) {
  try {
    const { message, history } = request.body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return response.status(400).json({
        success: false,
        message: "message is required",
      });
    }

    response.setHeader("Content-Type", "text/plain; charset=utf-8");

    await streamChatReply({
      message,
      history: Array.isArray(history) ? history : [],
      onChunk: (text) => {
        response.write(text);
      },
    });

    response.end();
  } catch (error) {
    console.error("Chat controller error:", error);

    if (!response.headersSent) {
      response.status(500).json({
        success: false,
        message: "Internal server error",
      });
    } else {
      response.end();
    }
  }
}

module.exports = {
  chatController,
};