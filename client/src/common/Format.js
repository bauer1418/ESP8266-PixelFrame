import Colors from "./Colors";

export const NumPixels = 5;

export const formatStringToPixel = pixelString => {
  const pixelData = {};
  pixelString.split("").forEach((character, index) => {
    let pixelIndex = parseInt(character, 10);
    if (isNaN(pixelIndex)) {
      pixelIndex = character.charCodeAt(0) - 55;
    }
    if (pixelIndex !== 16) {
      pixelData[index] = Colors[pixelIndex];
    }
    //console.log(Colors[pixelIndex], pixelIndex);
  });
  return pixelData;
};

export const formatPixelToString = pixelColors => {
  const pixelIndex = [];
  for (let y = 0; y < NumPixels; y++) {
    for (let x = 0; x < NumPixels; x++) {
      const index = y * NumPixels + x;
      const pixel = pixelColors[index];
      if (pixel) {
        const index = Colors.indexOf(pixel);
        let character = index;
        if (index > 9) {
          character = String.fromCharCode(index + 55);
        }
        pixelIndex.push(character);
      } else {
        pixelIndex.push("G");
      }
    }
  }
  return pixelIndex;
};
