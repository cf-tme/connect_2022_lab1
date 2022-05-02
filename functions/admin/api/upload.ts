import { jsonResponse } from "../../utils/jsonResponse";
import { parseFormDataRequest } from "../../utils/parseFormDataRequest";
import { IMAGE_KEY_PREFIX } from "../../utils/constants";

export const onRequestPost: PagesFunction<{
  IMAGES: KVNamespace;
}> = async ({ request, env }) => {
  const { apiToken, accountId } = (await env.IMAGES.get(
    "setup",
    "json"
  )) as Setup;

  // Prepare the Cloudflare Images API request body
  const formData = await request.formData();
  formData.set("requireSignedURLs", "true");
  const alt = formData.get("alt") as string;
  formData.delete("alt");
  const isPrivate = formData.get("isPrivate") === "on";
  formData.delete("isPrivate");

  // Upload the image to Cloudflare Images
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`,
    {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    }
  );

  // Store the image metadata in KV
  const {
    result: {
      id,
      filename: name,
      uploaded,
      variants: [url],
    },
  } = await response.json<{
    result: {
      id: string;
      filename: string;
      uploaded: string;
      requireSignedURLs: boolean;
      variants: string[];
    };
  }>();

  const metadata: ImageMetadata = {
    id,
    previewURLBase: url.split("/").slice(0, -1).join("/"),
    name,
    alt,
    uploaded,
    isPrivate,
  };

  await env.IMAGES.put(
    `image:uploaded:${uploaded}`,
    "Values stored in metadata.",
    { metadata }
  );
  await env.IMAGES.put(`image:${id}`, JSON.stringify(metadata));

  return jsonResponse(true);
};
