/*
    // translate.js \\
    Translates a string into image data.

*/ 

// To begin, we import the necessary modules.
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// We will export the functions using module.exports.
// This function will translate a string into image data. The way we translate is:
/*
    1. We create a canvas with the width and height of the image.
    2. We load the image.
    3. We draw the image on the canvas.
    4. We encode the string to base64, then to hex.
    5. We loop through the hex string, inserting the hex data from top to bottom on every odd pixel.
    6. We return the canvas data.
*/
module.exports.toImageData = async function toImageData(string, image) {
    // To begin, we need to insert a character to determine the end of the string. We insert unicode character 156 String Terminator. (U+009C)
    string += '\u009C';
    // Before we do anything, we check if the string is too long. We need to reserve 9 pixels for the signature, so we check the string with (pixels/2) - 9.
    if (string.length > ((image.width * image.height) / 2) - 9) throw new Error('String too long.');
    console.log("Passed string length check.")
    // Now we check if the image is valid. We do this by 
    // We create a canvas with the width and height of the image.
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    console.log("Created canvas.")
    // We load the image.
    //const img = await loadImage(image.path);
    const img = image; // Temporary fix
    console.log("Loaded image.")
    // We draw the image on the canvas.
    ctx.drawImage(img, 0, 0, image.width, image.height);
    console.log("Drew image.")
    // We encode the string to base64, then to hex.
    const hex = Buffer.from(string).toString('hex');
    console.log("Encoded string.")
    // We loop through the hex string, inserting the hex data from top to bottom on every 4th pixel.
    // We exclude the last 9 pixels, as they are the signature.
    // We also make sure not to overwrite any pixels unless there is data to insert, else we will get a green overlay.
    let i = 0;
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (x % 2 == 1) {
                if (i < hex.length - 3) {
                    const color = hex[i] + hex[i + 1] + hex[i + 2];
                    ctx.fillStyle = '#' + color;
                    ctx.fillRect(x, y, 1, 1);
                    i += 3;
                }
            }
        }
    }
    console.log("Inserted string.")
    // As a final step, and so we never encode an already encoded image, we write a signature to the last 9 pixels.
    // We use the same method as above, but we write to the bottom right corner with the text "PXSCRB".
    // We also make sure we don't write any data we don't need to.
    const signature = Buffer.from('PXSCRB').toString('hex');
    i = 0;
    for (let y = image.height - 1; y > image.height - 10; y--) {
        for (let x = image.width - 1; x > image.width - 10; x--) {
            if (x % 2 == 1) {
                if (i < signature.length - 3) {
                    const color = signature[i] + signature[i + 1] + signature[i + 2];
                    ctx.fillStyle = '#' + color;
                    ctx.fillRect(x, y, 1, 1);
                    i += 3;
                }
            }
        }
    }
    console.log("Inserted signature.")

    // We return the canvas data.
    return canvas.toDataURL();
}

// This function will translate a translated image into a string. Translation method is the same as above, but in reverse.
// We exclude the last 9 pixels, as they are the signature.
module.exports.fromImageData = async function fromImageData(image) {
    // We create a canvas with the width and height of the image.
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    // We load the image.
    //const img = await loadImage(image.path);
    const img = image; // Temporary fix
    // We draw the image on the canvas.
    ctx.drawImage(img, 0, 0, image.width, image.height);
    // We encode the string to base64, then to hex.
    // We use the same method as in toImageData, but in reverse. We also read, not write. Basically, we read every 4th pixel, up to the last 9 pixels.
    // We need to stop reading when we decode a null character, as that is the end of the string. (/0)
    let string = '';
    let i = 0;
    let end = false;
    // As an extra failsafe, if we start reading data that isn't a unicode character, we stop reading.
    // We use the regex expression `[^\u0000-\u007F]+` to check if the string is not unicode.
    // If it isn't, we stop reading. We also stop reading if the string is too long.
    const regex = new RegExp('[^\\u0000-\\u007F]+');
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (x % 2 == 1) {
                if (i < image.height * image.width - 9) {
                    const color = ctx.getImageData(x, y, 1, 1).data;
                    const hexR = color[0].toString(16).padStart(2, '0');
                    const hexG = color[1].toString(16).padStart(2, '0');
                    const hexB = color[2].toString(16).padStart(2, '0');
                    // Check if hexR is the terminator character.
                    if (hexR == 'cc' && hexG == '22') {
                        end = true;
                        break;
                    }
                    // Check if hexR is not unicode.
                    if (regex.test(hexR)) {
                        end = true;
                        break;
                    }
                    // We add the hex data to the string.
                    string += hexR;
                    // There is definitely a better way to do this, but I'm too lazy to find it.
                    // Repeat for hexG and hexB. This won't be commented, as it is the same as above.
                    if (hexG == 'cc' && hexB == '22') {
                        end = true;
                        break;
                    }
                    if (regex.test(hexG)) {
                        end = true;
                        break;
                    }
                    string += hexG;
                    // Repeat for hexB.
                    if (hexB == 'cc') { 
                        end = true;
                        break;
                    }
                    if (regex.test(hexB)) {
                        end = true;
                        break;
                    }
                    string += hexB;
                }
            }
            if (end) break;
        }
        if (end) break;
    }

    // We return the canvas data.
    return Buffer.from(string, 'hex').toString();
}