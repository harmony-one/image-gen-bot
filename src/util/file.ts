import axios from "axios";
import sharp from "sharp";
import fs from "fs";

export const getImage = async (filePath: string, ctx: any) => {
  const imageFilename = `image_${Date.now()}.jpg`;
  await axios({
    url: filePath,
    responseType: "stream",
  }).then(
    (response) =>
      new Promise<void>((resolve, reject) => {
        response.data
          .pipe(fs.createWriteStream(imageFilename))
          .on("finish", () => resolve())
          .on("error", (error: any) => reject(error));
      })
  );
  const convertedFilename = `image_${Date.now()}.png`;
  const imageInfo = await sharp(imageFilename)
    .toFormat("png")
    .ensureAlpha()
    .toFile(convertedFilename);
  fs.unlinkSync(imageFilename);
  console.log(imageInfo);
  if (imageInfo.format !== "png") {
    fs.unlinkSync(convertedFilename);
    ctx.reply("Please send a valid PNG image.");
    return;
  }

  const imageSize = fs.statSync(convertedFilename).size;
  const maxSize = 4 * 1024 * 1024; // 4MB
  if (imageSize > maxSize) {
    fs.unlinkSync(convertedFilename);
    ctx.reply("The image size exceeds the limit of 4MB.");
    return;
  }

  const imageDimensions = await sharp(convertedFilename).metadata();
  if (imageDimensions.width !== imageDimensions.height) {
    fs.unlinkSync(convertedFilename);
    ctx.reply("Please send a square image.");
    return;
  }

  return {
    file: fs.createReadStream(convertedFilename),
    fileName: convertedFilename
  }
};

export const deleteFile = (fileName: string) => {
  fs.unlinkSync(fileName);
}
