const sharp = require("sharp");
const aws = require("aws-sdk");
const s3 = new aws.S3();
 
const BUCKET = "cafe-cok-images";

const folders = [
  { name: "resized/cafe-main-medium", width: 390, height: 228 },
  { name: "resized/cafe-main-thumbnail", width: 176, height: 176 },
  { name: "resized/cafe-thumbnail", width: 176, height: 176 },
  { name: "resized/menu-thumbnail", width: 176, height: 176 },
  { name: "resized/review-thumbnail", width: 176, height: 176 },
];

exports.handler = async (event, _, callback) => {
    const key = event.Records[0].s3.object.key;
    const parts = key.split("/");
    const lastFolderName = parts[parts.length - 2];
    const filename = parts[parts.length - 1];
    const extension = filename.substring(filename.lastIndexOf(".") + 1);
   
    try {
      const image = await s3.getObject({ Bucket: BUCKET, Key: key }).promise();
      if(lastFolderName === "cafe-main") {

        const cafeMediumFolder = folders.find(folder => folder.name === "resized/cafe-main-medium");
        const cafeThumbnailFolder = folders.find(folder => folder.name === "resized/cafe-main-thumbnail");

        await Promise.all([
            resizeAndUpload(image, cafeMediumFolder, filename, extension),
            resizeAndUpload(image, cafeThumbnailFolder, filename, extension)
        ]);
      } else if (lastFolderName === "cafe") {

        const cafeThumbnailFolder = folders.find(folder => folder.name === "resized/cafe-thumbnail");
        await resizeAndUpload(image, cafeThumbnailFolder, filename, extension);
      } else if (lastFolderName === "menu") {

        const menuThumbnailFolder = folders.find(folder => folder.name === "resized/menu-thumbnail");
        await resizeAndUpload(image, menuThumbnailFolder, filename, extension);
      } else if (lastFolderName === "review") {
        
        const reviewThumbnailFolder = folders.find(folder => folder.name === "resized/review-thumbnail");
        await resizeAndUpload(image, reviewThumbnailFolder, filename, extension);
      }
  
      callback(null, `file resize success: ${filename}`);
    } catch (error) {
      callback(`file resize error: ${error}`);
    }
  }
  
  async function resizeAndUpload(image, folder, filename, extension) {
    const resizedImage = await resizeImage(image, folder);
    await uploadToS3(resizedImage, folder.name, filename, extension);
  }

  async function resizeImage(image, folder) {
    try {
        const resizedImage = await sharp(image.Body)
        .resize({ 
            width: folder.width,
            height: folder.height,
            fit: 'cover',
         })
        .toBuffer();
      return resizedImage;
    } catch (error) {
      throw new Error(error);
    }
  }
  
  async function uploadToS3(resizedImage, folder, filename, extension) {
    const params = {
      Bucket: BUCKET,
      Key: `${folder}/${filename}`,
      Body: resizedImage,
      ACL: 'public-read',
      ContentType: 'image/'+extension,
    };
  
    try {
      await s3.putObject(params).promise();
    } catch(error) {
      throw new Error(error);
    }
  }
