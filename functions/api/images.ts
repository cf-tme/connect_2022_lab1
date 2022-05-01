import { jsonResponse } from "../utils/jsonResponse";
import { IMAGE_KEY_PREFIX } from "../utils/constants";
import { generateSignedURL } from "../utils/generateSignedURL";

export const jsonResponse = (value: any, init: ResponseInit = {}) =>
  new Response(JSON.stringify(value), {
    headers: { "Content-Type": "application/json", ...init.headers },
    ...init,
  });

const generatePreviewURL = ({
  previewURLBase,
  imagesKey,
  isPrivate,
}: {
  previewURLBase: string;
  imagesKey: string;
  isPrivate: boolean;
}) => {
  // If isPrivate, generates a signed URL for the 'preview' variant
  // Else, returns the 'blurred' variant URL which never requires signed URLs
  // https://developers.cloudflare.com/images/cloudflare-images/serve-images/serve-private-images-using-signed-url-tokens

  return "SIGNED_URL";
};

export const onRequestGet: PagesFunction<{
  IMAGES: KVNamespace;
}> = async ({ env }) => {
  const { imagesKey } = (await env.IMAGES.get("setup", "json")) as Setup;

  const kvImagesList = await env.IMAGES.list<ImageMetadata>({
    prefix: `image:uploaded:`,
  });

  const images = kvImagesList.keys
    .map((kvImage) => {
      try {
        const { id, previewURLBase, name, alt, uploaded, isPrivate } =
          kvImage.metadata as ImageMetadata;

        const previewURL = generatePreviewURL({
          previewURLBase,
          imagesKey,
          isPrivate,
        });

        return {
          id,
          previewURL,
          name,
          alt,
          uploaded,
          isPrivate,
        };
      } catch {
        return undefined;
      }
    })
    .filter((image) => image !== undefined);

  return jsonResponse({ images });
};