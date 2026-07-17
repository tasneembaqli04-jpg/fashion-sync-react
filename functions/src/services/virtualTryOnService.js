const sharp = require("sharp");
const {GoogleAuth} = require("google-auth-library");

const PROJECT_ID =
  process.env.GCLOUD_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  "fashionsync-dc79f";

const LOCATION = "us-central1";
const MODEL_ID = "virtual-try-on-001";

/**
 * Converts a Data URL into raw Base64 data.
 */
function parseDataUrl(dataUrl) {
  const match = String(dataUrl || "").match(
    /^data:(image\/(?:png|jpeg|jpg));base64,(.+)$/,
  );

  if (!match) {
    throw new Error(
      "Customer image must be a valid PNG or JPEG Data URL.",
    );
  }

  const buffer = Buffer.from(match[2], "base64");

  if (!buffer.length) {
    throw new Error("Customer image is empty.");
  }

  if (buffer.length > 10 * 1024 * 1024) {
    throw new Error("Customer image must be smaller than 10 MB.");
  }

  const mimeType =
    match[1] === "image/jpg" ? "image/jpeg" : match[1];

  return {
    mimeType,
    base64: match[2],
  };
}

/**
 * Downloads an image URL and converts it to Base64.
 */
async function downloadImageAsBase64(imageUrl) {
  const imageResponse = await fetch(imageUrl);

  if (!imageResponse.ok) {
    throw new Error(
      `Failed to download product image: ${imageResponse.status}`,
    );
  }

  const contentType =
    imageResponse.headers.get("content-type") || "";

  const arrayBuffer = await imageResponse.arrayBuffer();
  let buffer = Buffer.from(arrayBuffer);

  if (!buffer.length) {
    throw new Error("Downloaded product image is empty.");
  }

  if (buffer.length > 10 * 1024 * 1024) {
    throw new Error("Product image must be smaller than 10 MB.");
  }

  let mimeType = contentType
    .split(";")[0]
    .trim()
    .toLowerCase();

  if (mimeType === "image/jpg") {
    mimeType = "image/jpeg";
  }

  // Virtual Try-On accepts PNG/JPEG input.
  // Convert WebP, AVIF or incorrectly labelled images to JPEG.
  if (!["image/png", "image/jpeg"].includes(mimeType)) {
    try {
      buffer = await sharp(buffer)
        .jpeg({
          quality: 92,
        })
        .toBuffer();

      mimeType = "image/jpeg";
    } catch (error) {
      console.error("Product image conversion failed:", error);

      throw new Error(
        "Product image could not be converted to PNG or JPEG.",
      );
    }
  }

  return {
    mimeType,
    base64: buffer.toString("base64"),
  };
}

/**
 * Gets an authenticated access token for Vertex AI.
 */
async function getAccessToken() {
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });

  const client = await auth.getClient();
  const accessTokenResponse = await client.getAccessToken();

  const token =
    typeof accessTokenResponse === "string" ?
      accessTokenResponse :
      accessTokenResponse?.token;

  if (!token) {
    throw new Error("Could not obtain a Google Cloud access token.");
  }

  return token;
}

/**
 * Generates a Virtual Try-On image through Vertex AI.
 */
async function generateVirtualTryOn({
  personImageUrl,
  productImageUrl,
}) {
  if (!personImageUrl) {
    throw new Error("Customer image is required.");
  }

  if (!productImageUrl) {
    throw new Error("Product image is required.");
  }

  const personImage = parseDataUrl(personImageUrl);
  const productImage = await downloadImageAsBase64(productImageUrl);
  const accessToken = await getAccessToken();

  const endpoint =
    `https://${LOCATION}-aiplatform.googleapis.com/v1/` +
    `projects/${PROJECT_ID}/locations/${LOCATION}/` +
    `publishers/google/models/${MODEL_ID}:predict`;

  const requestBody = {
    instances: [
      {
        personImage: {
          image: {
            bytesBase64Encoded: personImage.base64,
          },
        },
        productImages: [
          {
            image: {
              bytesBase64Encoded: productImage.base64,
            },
          },
        ],
      },
    ],
    parameters: {
      sampleCount: 1,
    },
  };

  const vertexResponse = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const responseData = await vertexResponse.json();

  if (!vertexResponse.ok) {
    console.error(
      "Virtual Try-On Vertex response:",
      JSON.stringify(responseData, null, 2),
    );

    const vertexMessage =
      responseData?.error?.message ||
      `Vertex AI request failed with status ${vertexResponse.status}.`;

    throw new Error(vertexMessage);
  }

  const prediction = responseData?.predictions?.[0];
  const generatedBase64 = prediction?.bytesBase64Encoded;

  if (!generatedBase64) {
    console.error(
      "Virtual Try-On missing image response:",
      JSON.stringify(responseData, null, 2),
    );

    throw new Error("Virtual Try-On returned no generated image.");
  }

  const mimeType = prediction?.mimeType || "image/png";

  return {
    imageBase64: generatedBase64,
    mimeType,
    resultImageUrl: `data:${mimeType};base64,${generatedBase64}`,
    model: MODEL_ID,
  };
}

module.exports = {
  generateVirtualTryOn,
};