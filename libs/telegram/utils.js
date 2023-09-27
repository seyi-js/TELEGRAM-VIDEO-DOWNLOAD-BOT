const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

const splitVideo = (videoPath, startTime, duration, outputName) => {
  return new Promise((resolve, reject) => {
    ffmpeg({
      source: videoPath,
    })
      .setStartTime(startTime)
      .setDuration(duration)
      .output(outputName)
      .on('end', () => resolve(outputName))
      .on('error', (err) => reject(err))
      .run();
  });
};

module.exports = {
  splitVideo,
};
