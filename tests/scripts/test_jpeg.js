/*
    // Test JPEG \\
    This test will test the translation (and reverse) to and from a JPEG image
    The test image is a 1536x1024 JPEG image, and the string will be "Hello From Pixscribe! This is a test string."
    The test will pass if the string is the same as the original string.
*/
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const translateUtil = require('../../util/translate.js');

// We won't export anything, as this is a test.
// To begin, we need to enter an async environment.
(async () => {
    // We load the image.
    console.log("Loading image...")
    const image = await loadImage(path.join(__dirname, '../images/jpeg_test.jpeg'));
    // We translate the image.
    console.log("Translating image...")
    const data = await translateUtil.toImageData('Hello From Pixscribe! This is a test string. It\'s a beautiful day! Fünfhundertfünfundfünfzig!', image);
    // We write the image to a file.
    console.log("Writing image...")
    fs.writeFileSync(path.join(__dirname, '../images/jpeg_test_translated.jpeg'), data.split(';base64,').pop(), { encoding: 'base64' });
    // We now need to reload the image, as we can't use the same image for both translation and reverse translation.
    console.log("Reloading image...")
    const newData = await loadImage(path.join(__dirname, '../images/jpeg_test_translated.jpeg'));
    // We translate the image back.
    console.log("Translating image back...")
    const string = await translateUtil.fromImageData(newData);
    // We check if the string is the same as the original string.
    if (string == 'Hello From Pixscribe! This is a test string.') {
        // If it is, we log that the test passed.
        console.log('Test passed.');
    } else {
        // If it isn't, we log that the test failed.
        console.log('Test failed.');
        console.log("Expected: 'Hello From Pixscribe! This is a test string.'");
        console.log("Got: '" + string + "'");
    }
    console.log('Test finished.');
})();