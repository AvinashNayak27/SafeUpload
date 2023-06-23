const axios = require("axios");

const videoPath = "/Users/avinashnayak/Desktop/hackfs23/backend/video/telugu.mp4";

axios
  .post("http://localhost:3000/nsfwcheck", { videoPath })
  .then((response) => {
    console.log(response.data);
    const { nsfwContent } = response.data;
    console.log(nsfwContent);
    if (nsfwContent?.length === 1) {
      axios
        .post("http://localhost:3000/uploadtolivepeer", {
          name: videoPath.slice(0, -4),
          description: "Test for NSFW content",
          videoUrl: videoPath,
        })
        .then((response) => {
          console.log("Asset uploaded to Livepeer");
          console.log(response.data.asset);
          axios
            .post("http://localhost:3000/uploadtow3", { videoPath })
            .then((response) => {
              console.log("Root CID uploaded to W3 Storage");
              console.log(response.data.rootCid);
            })
            .catch((error) => {
              console.error(error);
            });
        })
        .catch((error) => {
          console.error(error);
        });
    }
  })
  .catch((error) => {
    console.error(error);
  });
