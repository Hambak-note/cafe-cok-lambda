const sharp = require("sharp");
const aws = require("aws-sdk");
const s3 = new aws.S3();
 
const BUCKET = "cafe-cok-images";

const folders = [
  { name: "resized/cafe-main-medium", width: 390, height: 228 },
  { name: "resized/cafe-main-thumbnail", width: 176, height: 176 },
  { name: "resized/cafe-thumbnail", width: 176, height: 176 },
  { name: "resized/menu-thumbnail", width: 176, height: 176 },
  { name: "resized/reivew-thumbnail", width: 176, height: 176 },
];

exports.handler = async (event, _, callback) => {
    const key = event.Records[0].s3.object.key;
    console.log("key : " + key);
    const parts = key.split("/");
    console.log("parts : " + parts);
    const lastFolderName = parts[parts.length - 2];
    console.log("lastFolderName : " + lastFolderName);
    const filename = parts[parts.length - 1];
    console.log("filename : " + filename);
    const extension = filename.substring(filename.lastIndexOf(".") + 1);
    console.log("extension : " + extension);
   
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
        
        const reviewThumbnailFolder = folders.find(folder => folder.name === "resized/reivew-thumbnail");
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
    console.log("진입점_1");
    try {
        console.log("진입점_2");
        console.log("너비 : " + folder.width);
        const resizedImage = await sharp(image.Body)
        .resize({ 
            width: folder.width,
            height: folder.height,
            fit: 'cover',
         })
        .toBuffer();
        console.log("진입점_3");
  
      return resizedImage;
    } catch (error) {
      throw new Error(error);
    }
  }
  
  async function uploadToS3(resizedImage, folder, filename, extension) {
    console.log("진입점_4");
    const params = {
      Bucket: BUCKET,
      Key: `${folder}/${filename}`,
      Body: resizedImage,
      ACL: 'public-read',
      ContentType: 'image/'+extension,
    };

    console.log("진입점_5");
  
    try {
      await s3.putObject(params).promise();
    } catch(error) {
      throw new Error(error);
    }
  }