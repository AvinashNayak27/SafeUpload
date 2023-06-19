# Hackfs2023

# SafeUpload
SafeUpload is an application that allows users to securely upload and store videos while ensuring they do not contain any Not Safe for Work (NSFW) content. It integrates with Livepeer for video uploading and Web3 Storage for decentralized and secure storage of the uploaded content.
- For video with no NSFW content Web UI

<img width="1127" alt="Screenshot 2023-06-18 at 8 42 12 PM" src="https://github.com/AvinashNayak27/hackfs23/assets/92907147/73e0b61b-33a7-43c8-99c5-c6e69b4dfd35">

- For video with NSFW content Web UI

<img width="1127" alt="Screenshot 2023-06-18 at 8 42 49 PM" src="https://github.com/AvinashNayak27/hackfs23/assets/92907147/9beae1c2-a9c1-4fb4-8dcf-56d80764039a">


### You can run the server at port 3000 and use the following code to test the app 

```
const axios = require("axios");

const videoPath = "deep.mp4";

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

```

### The following are the responses of above code test

- For video with no NSFW content response

<img width="621" alt="Screenshot 2023-06-19 at 9 50 16 AM" src="https://github.com/AvinashNayak27/hackfs23/assets/92907147/a70724dc-6b83-48e2-8a8e-af0bd9699732">

- For video with NSFW content response

<img width="504" alt="Screenshot 2023-06-19 at 9 53 41 AM" src="https://github.com/AvinashNayak27/hackfs23/assets/92907147/fb252f57-c459-424f-800d-e76b42b2e53d">


## Features
- NSFW Content Detection: The app utilizes NSFW detection 
algorithms to analyze videos and determine if they contain explicit or inappropriate content.
- Livepeer Integration: SafeUpload seamlessly integrates with Livepeer to facilitate secure and reliable video uploading.
- Web3 Storage Integration: Uploaded videos are stored on Web3 Storage, ensuring decentralized and immutable storage for increased data security.
- Automated NSFW Check: Videos undergo an automated NSFW check before being uploaded, preventing the upload of explicit or inappropriate content.
- Server Architecture: The app follows a client-server architecture, where the server handles the NSFW detection, video uploading to Livepeer, and storage to Web3 Storage.


## Architecture
The SafeUpload app follows a client-server architecture, with the following components:

### Client
The client-side of the app consists of the following:

Frontend UI: The user interface where users can initiate video uploads, view upload progress, and receive notifications. built using vite react

### Server

The server-side of the app consists of the following:

- Express.js Server: The backend server built using Express.js that handles incoming requests and responses.
- ffmpeg: Converts the videos into snapshopts and sends for NSFWcheck
- NSFW Detection: Utilizes the NSFW detection library to analyze generated snapshots and determine if they contain explicit or inappropriate content.
- Livepeer Integration: Interacts with the Livepeer API to facilitate secure video uploading and processing.
- Web3 Storage Integration: Uses the Web3 Storage client library to store the uploaded videos in a decentralized and secure manner.

## Getting Started
To get started with SafeUpload, follow these steps:

Clone the repository: git clone https://github.com/AvinashNayak27/hackfs23

### Start the server
```

cd backend

Install dependencies: yarn

node app.js
```

### Start the client

```

cd frontend

Install dependencies: yarn

yarn dev

```

Monitor the console output for NSFW checks, Livepeer uploads, and Web3 Storage uploads.

Access the frontend UI to view the upload progress and notifications.
