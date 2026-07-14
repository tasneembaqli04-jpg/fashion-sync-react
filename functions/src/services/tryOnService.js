const { ai } = require("../config/gemini");

const MODEL_NAME = "gemini-2.5-flash-image";

function normalizeCategory(product) {
  const rawCategory = String(
    product.category ||
      product.cat ||
      product.type ||
      product.name ||
      ""
  ).toLowerCase();

  if (
    rawCategory.includes("dress") ||
    rawCategory.includes("שמלה") ||
    rawCategory.includes("فساتين") ||
    rawCategory.includes("فستان")
  ) {
    return "dress";
  }

  if (
    rawCategory.includes("shirt") ||
    rawCategory.includes("top") ||
    rawCategory.includes("blouse") ||
    rawCategory.includes("חולצה") ||
    rawCategory.includes("قميص") ||
    rawCategory.includes("بلوزة")
  ) {
    return "shirt";
  }

  if (
    rawCategory.includes("pants") ||
    rawCategory.includes("trousers") ||
    rawCategory.includes("jeans") ||
    rawCategory.includes("מכנס") ||
    rawCategory.includes("بنطال") ||
    rawCategory.includes("جينز")
  ) {
    return "pants";
  }

  if (
    rawCategory.includes("skirt") ||
    rawCategory.includes("חצאית") ||
    rawCategory.includes("تنورة")
  ) {
    return "skirt";
  }

  if (
    rawCategory.includes("jacket") ||
    rawCategory.includes("coat") ||
    rawCategory.includes("blazer") ||
    rawCategory.includes("ז'קט") ||
    rawCategory.includes("מעיל") ||
    rawCategory.includes("جاكيت") ||
    rawCategory.includes("معطف")
  ) {
    return "jacket";
  }

  return "clothing";
}

function getCategoryInstructions(category) {
  switch (category) {
    case "dress":
      return `
This product is a full dress.

Mandatory dressing instructions:
- Remove or fully cover the customer's existing upper-body clothing.
- Remove or fully cover the customer's existing lower-body clothing.
- Replace the complete visible outfit with the dress from Image 2.
- The dress must remain one continuous garment from the upper body to its original hemline.
- Do not split the dress into a shirt and skirt.
- Do not interpret the dress as a skirt.
- Do not leave the customer's original shirt visible above the dress.
- Do not leave the customer's original pants visible through or below the dress, except when naturally hidden by the dress length.
- Preserve the exact dress length shown in Image 2.
`;

    case "shirt":
      return `
This product is an upper-body garment.

Mandatory dressing instructions:
- Replace only the customer's existing upper-body clothing.
- Keep the customer's pants, skirt, or other lower-body clothing unchanged.
- The shirt must cover the same body region as the product shown in Image 2.
- Preserve the exact neckline, sleeve length, fit, and hem shape.
- Do not turn the shirt into a dress, jacket, crop top, or different garment.
`;

    case "pants":
      return `
This product is a lower-body garment.

Mandatory dressing instructions:
- Replace only the customer's existing pants, jeans, shorts, or lower-body clothing.
- Keep the customer's upper-body clothing unchanged.
- Preserve the exact waist height, leg width, length, cut, and silhouette.
- Do not transform the pants into a skirt or shorts.
`;

    case "skirt":
      return `
This product is a skirt.

Mandatory dressing instructions:
- Replace only the customer's existing lower-body garment.
- Keep the customer's upper-body clothing unchanged.
- Preserve the exact waistband, shape, pattern, and hem length.
- Do not transform the skirt into pants, shorts, or a full dress.
`;

    case "jacket":
      return `
This product is an outerwear garment.

Mandatory dressing instructions:
- Place the jacket naturally over the customer's existing clothing.
- Do not remove the customer's base clothing unless required for natural layering.
- Preserve the exact opening, collar, sleeves, length, buttons, zipper, and structure.
- Do not transform the jacket into a shirt, dress, or unrelated garment.
`;
    case "jewelry":
  return `
This product is a jewelry item.

Mandatory placement instructions:
- First identify whether Image 2 shows a necklace, bracelet, earrings, or ring.
- Add only the jewelry item shown in Image 2.
- Place the jewelry on the anatomically correct body area.
- If it is a necklace, place it naturally around the customer's neck and upper chest.
- If it is a bracelet, place it naturally around one visible wrist.
- If it is earrings, place them naturally on the visible ears.
- If it is a ring, place it naturally on one visible finger.
- Do not add more jewelry items than shown in Image 2.
- Do not replace existing clothing.
- Do not redesign, recolor, remove, or modify any clothing.
- Do not change the customer's shoes, bag, hairstyle, makeup, or other accessories.
- Preserve the person's face, identity, body proportions, pose, hands, skin tone, and background.
- Preserve the jewelry's exact metal color, stones, shape, size, chain style, clasp, decorations, and overall design.
- Make the jewelry size realistic relative to the customer's body.
- Use realistic reflections, shadows, lighting, depth, and perspective.
- Do not create oversized, floating, duplicated, or distorted jewelry.
`;
    default:
      return `
This product is a clothing item.

Mandatory dressing instructions:
- Identify the exact garment type shown in Image 2.
- Replace only the clothing region that corresponds to that garment.
- Do not replace unrelated clothing items.
- Do not reinterpret the garment as a different clothing category.
`;
  }
}

function buildTryOnPrompt(product) {
  const category = normalizeCategory(product);
  const categoryInstructions = getCategoryInstructions(category);

  return `
Image 1 is the customer photo.
Image 2 is the exact product reference image.

Generate one realistic virtual fashion try-on image.

The person from Image 1 must wear the exact product shown in Image 2.

Product information:
- Product code: ${product.code || "unknown"}
- Product name: ${product.name || "unknown"}
- Detected garment type: ${category}
- Original category: ${product.category || product.cat || "unknown"}
- Requested color: ${
    product.color || "use the exact visible color from Image 2"
  }

${categoryInstructions}

The product image is the authoritative reference.

Exact product preservation requirements:
- Preserve the product's exact garment category.
- Preserve the exact main color.
- Preserve all visible secondary colors.
- Preserve the exact print, pattern, logo, graphics, embroidery, and decorations.
- Preserve the exact neckline.
- Preserve the exact sleeve style and sleeve length.
- Preserve the exact garment length.
- Preserve the exact silhouette and cut.
- Preserve visible seams, buttons, pockets, belts, straps, zippers, and closures.
- Preserve the apparent fabric texture and material.
- Do not simplify the garment.
- Do not redesign the garment.
- Do not invent missing decorations.
- Do not substitute a similar product.
- Do not change the product into another fashion style.

Customer preservation requirements:
- Preserve the customer's face exactly.
- Preserve identity, facial features, hairstyle, and expression.
- Preserve body proportions.
- Preserve pose and camera angle.
- Preserve hands and visible body parts.
- Preserve skin tone.
- Preserve the original background.
- Do not beautify, reshape, slim, enlarge, or alter the person.

Realism requirements:
- Fit the garment naturally onto the customer's body.
- Use realistic folds, shadows, depth, lighting, and perspective.
- Respect body occlusion and garment layering.
- Ensure that the garment follows the customer's pose.
- Avoid duplicated limbs, distorted hands, extra fabric, or floating clothing.
- Produce a clean, realistic e-commerce-quality result.

Final verification before generating:
- Confirm internally that the garment type matches Image 2.
- Confirm internally that the color and pattern match Image 2.
- Confirm internally that no unrelated clothing was changed.
- Confirm internally that the customer's original clothing is not incorrectly visible through the replacement garment.

Return exactly one final generated image.
`;
}

async function downloadProductImage(productImageUrl) {
  const response = await fetch(productImageUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to download product image: ${response.status} ${response.statusText}`
    );
  }

  const contentType =
    response.headers.get("content-type") || "image/jpeg";

  if (!contentType.startsWith("image/")) {
    throw new Error("Product URL did not return a valid image");
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  return {
    buffer,
    mimeType: contentType,
  };
}

async function generateTryOn(product, imageUrl) {
  if (!product) {
    throw new Error("Product data is required");
  }

  if (!imageUrl) {
    throw new Error("Customer image is required");
  }

  if (!product.img) {
    throw new Error("Product image is required");
  }

  const matches = imageUrl.match(/^data:(image\/[\w.+-]+);base64,(.+)$/);

  if (!matches) {
    throw new Error("Invalid customer image format");
  }

  const customerMimeType = matches[1];
  const customerImageBuffer = Buffer.from(matches[2], "base64");

  if (!customerImageBuffer.length) {
    throw new Error("Customer image is empty");
  }

  const {
    buffer: productImageBuffer,
    mimeType: productMimeType,
  } = await downloadProductImage(product.img);

  const prompt = buildTryOnPrompt(product);

  const result = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: prompt,
          },
          {
            inlineData: {
              mimeType: customerMimeType,
              data: customerImageBuffer.toString("base64"),
            },
          },
          {
            inlineData: {
              mimeType: productMimeType,
              data: productImageBuffer.toString("base64"),
            },
          },
        ],
      },
    ],
    config: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  });

  const parts = result.candidates?.[0]?.content?.parts || [];

  const imagePart = parts.find(
    (part) =>
      part.inlineData?.data &&
      part.inlineData?.mimeType?.startsWith("image/")
  );

  if (!imagePart) {
    const modelText = parts
      .filter((part) => part.text)
      .map((part) => part.text)
      .join("\n");

    console.error("Gemini did not return an image:", modelText);

    throw new Error("Gemini did not return a generated image");
  }

  return {
    success: true,
    message: "Try On image generated successfully",
    imageBase64: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType || "image/png",
  };
}

module.exports = {
  generateTryOn,
};