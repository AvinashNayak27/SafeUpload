const express = require("express");
const fs = require("fs");
const tf = require("@tensorflow/tfjs-node");
const nsfw = require("nsfwjs");
const { spawn } = require("child_process");
const path = require("path");
const ffmpeg = require("ffmpeg-static");
const cors = require("cors");
const livepeer = require("@livepeer/react");
const w3 = require("web3.storage");
const fileUpload = require("express-fileupload");
const app = express();
const port = 3000;
app.use(cors());
app.use(fileUpload());
app.use(express.json());
const { provider } = livepeer.createClient({
  provider: livepeer.studioProvider({
    apiKey: "76831c0e-4b22-4db5-9867-45362ce2bb32",
  }),
});

const API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweGM1MjA2NGYwMmEyYzExYzlENTI2MkVDNDBBMjZFMkI0MmNFNEMwN0QiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2ODcwNTM2MDY4OTIsIm5hbWUiOiJoYWNrZnMifQ.LQH65tBStJyfPViq7CE5YFoOf2Bz2a90jQ2hbj6QqGE";

const client = new w3.Web3Storage({ token: API_KEY });

// Output directory to save the snapshots
const outputDirectory = "data";

const videoDirectory = "video";

// Frame rate (number of frames per second)
const frameRate = 0.1; // Change this value as desired

// Generate snapshots using FFmpeg
let snapshotsGeneratedPromise = Promise.resolve();

async function uploadToW3Storage(video) {
  console.log("Uploading to Web3 Storage");
  const files = await w3.getFilesFromPath(video);
  const rootCid = await client.put(files);
  console.log("Uploades successfully to web3 storage");
  return rootCid;
}

// Generate snapshots using FFmpeg
const generateSnapshots = async (videoPath) => {
  const snapshotFilename = "snapshot_%01d.jpg"; // Change the filename format if needed
  const existingSnapshots = fs
    .readdirSync(outputDirectory)
    .filter((file) => file.startsWith("snapshot_"));
  existingSnapshots.forEach((snapshot) => {
    const snapshotPath = path.join(outputDirectory, snapshot);
    fs.unlinkSync(snapshotPath);
  });

  // FFmpeg command to generate snapshots
  const ffmpegCommand = [
    "-i",
    videoPath,
    "-vf",
    `fps=${frameRate}`,
    path.join(outputDirectory, snapshotFilename),
  ];

  // Run FFmpeg command
  const ffmpegProcess = spawn(ffmpeg, ffmpegCommand);

  return new Promise((resolve, reject) => {
    // Handle process events
    ffmpegProcess.on("error", (error) => {
      console.error("FFmpeg process error:", error);
      reject(error);
    });

    ffmpegProcess.on("close", (code) => {
      if (code === 0) {
        console.log("Snapshots generated successfully!");
        resolve();
      } else {
        console.error("Snapshots generation failed with code:", code);
        reject(`Snapshots generation failed with code: ${code}`);
      }
    });
  });
};

app.post("/upload", async (req, res) => {
  if (!req.files || !req.files.video) {
    return res.status(400).send("No video file uploaded");
  }

  const video = req.files.video;
  if (video.mimetype !== "video/mp4") {
    return res
      .status(400)
      .send("Invalid file format. Only .mp4 files are allowed");
  }

  // Move the video file to the desired location on the server
  const uploadPath = path.join(__dirname, "video", video.name);
  video.mv(uploadPath, (error) => {
    if (error) {
      console.error("Error:", error);
      return res
        .status(500)
        .send("An error occurred while uploading the video");
    }
  });
  res.send({ uploadPath });
});

app.post("/nsfwcheck", async (req, res) => {
  try {
    const { videoPath } = req.body;
    console.log("Video path:", videoPath);

    await snapshotsGeneratedPromise;
    snapshotsGeneratedPromise = generateSnapshots(videoPath);

    // Wait for snapshots to be generated
    await snapshotsGeneratedPromise;

    const snapshotFiles = fs.readdirSync(outputDirectory);
    const snapshotCount = snapshotFiles.length;
    console.log("Number of snapshots generated:", snapshotCount);

    if (snapshotCount) {
      const meanValues = [];
      const data = [];
      const nsfwContent = [];
      for (let index = 2; index <= snapshotCount; index++) {
        const imageBuffer = fs.readFileSync(
          path.join(outputDirectory, `snapshot_${index}.jpg`)
        );

        const model = await nsfw.load();

        // Decode the image buffer into a tf.Tensor3D
        const image = tf.node.decodeImage(imageBuffer, 3);

        const predictions = await model.classify(image);
        console.log(index);
        data.push(predictions);

        image.dispose();
      }
      for (let i = 0; i < data[0].length; i++) {
        let sum = 0;
        for (let j = 0; j < data.length; j++) {
          sum += data[j][i].probability;
        }
        const mean = sum / data.length;

        const className = data[0][i].className; // Using the class name from the first array
        if (
          mean > 0.7 &&
          (className === "Sexy" ||
            className === "Hentai" ||
            className === "Porn")
        ) {
          console.log("Your post contains NSFW content:", className);
          nsfwContent.push("Your post contains NSFW content:", className);
        }
        if (
          mean > 0.7 &&
          (className === "Drawing" || className === "Neutral")
        ) {
          console.log("Your post is safe for work");
          nsfwContent.push("Your post is safe for work");
        }

        meanValues.push({ className, mean });
      }

      res.json({ meanValues, nsfwContent });
    } else {
      res.json({ meanValues: [], nsfwContent: [] });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred during NSFW check" });
  }
});

app.post("/uploadtow3", async (req, res) => {
  try {
    const { videoPath } = req.body;
    const rootCid = await uploadToW3Storage(videoPath);
    res.json({ rootCid });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ error: "An error occurred during W3 Storage upload" });
  }
});

app.post("/uploadtolivepeer", async (req, res) => {
  try {
    const { name, description, videoUrl } = req.body;
    const asset = await uploadAsset({ name, description, videoUrl });
    res.json({ asset });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred during Livepeer upload" });
  }
});

app.post("/deleteSnapshots", async (req, res) => {
  try {
    fs.readdir(outputDirectory, (err, files) => {
      if (err) {
        console.log("Unable to scan directory: " + err);
        return;
      }

      // Iterate through each file in the directory
      files.forEach((file) => {
        const filePath = path.join(outputDirectory, file);

        // Delete the file
        fs.unlink(filePath, (error) => {
          if (error) {
            console.log("Error deleting file: " + error);
          } else {
            console.log("Successfully deleted file: " + filePath);
          }
        });
      });
    });
    res.json({ message: "Successfully deleted all files" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred while deleting files" });
  }
});
app.post("/deleteVideo", async (req, res) => {
  try {
    fs.readdir(videoDirectory, (err, files) => {
      if (err) {
        console.log("Unable to scan directory: " + err);
        return;
      }

      // Iterate through each file in the directory
      files.forEach((file) => {
        const filePath = path.join(videoDirectory, file);

        // Delete the file
        fs.unlink(filePath, (error) => {
          if (error) {
            console.log("Error deleting file: " + error);
          } else {
            console.log("Successfully deleted file: " + filePath);
          }
        });
      });
    });
    res.json({ message: "Successfully deleted video" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred while deleting files" });
  }
});

async function uploadAsset(video) {
  console.log("Uploading asset to livepeer..");

  stream = fs.createReadStream(video.videoUrl);

  const asset = await provider.createAsset({
    sources: [
      {
        name: video.name,
        file: stream,
      },
    ],
  });
  console.log("Asset uploaded successfully to livepeer");

  return asset;
}

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
