import React, { useState } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import "./App.css";
import { Player } from "@livepeer/react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from "wagmi";
import { createPublicClient, http } from 'viem'
import { goerli } from 'viem/chains'
import { normalize } from "viem/ens";



const App = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [asset, setAsset] = useState(null);
  const [droppedFileName, setDroppedFileName] = useState("");
  const [rootCid, setRootCid] = useState(null);


  const onDrop = async (acceptedFiles) => {
    const videoPath = acceptedFiles[0].path;
    setDroppedFileName(acceptedFiles[0].name);

    try {
      setLoading(true);
      const response = await axios.post("http://localhost:3000/nsfwcheck", {
        videoPath,
      });

      const { nsfwContent } = response.data;
      console.log(nsfwContent); // Add this line

      if (nsfwContent?.length === 1) {
        setMessages([
          ...messages,
          "NSFW content not detected. Uploading asset to Livepeer...",
        ]);

        setLoading(true);
        const assetResponse = await axios.post(
          "http://localhost:3000/uploadtolivepeer",
          {
            name: videoPath.slice(0, -4),
            description: "Test for NSFW content",
            videoUrl: videoPath,
          }
        );
        console.log("Asset uploaded to Livepeer");
        console.log(assetResponse.data.asset);
        setAsset(assetResponse.data.asset);
        setMessages([...messages, "Asset uploaded to Livepeer"]);

        setLoading(true);
        const rootCidResponse = await axios.post(
          "http://localhost:3000/uploadtow3",
          { videoPath }
        );
        console.log("Root CID uploaded to W3 Storage");
        console.log(rootCidResponse.data.rootCid);
        setRootCid(rootCidResponse.data.rootCid);
        setMessages([...messages, "Video uploaded to W3 Storage"]);
        setTimeout(() => {
          setMessages([]);
        }, 5000);
      } else {
        setMessages(["Cannot upload because your video has NSFW content"]);
        setTimeout(() => {
          setMessages([]);
        }, 5000);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  console.log(messages);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const { address, isConnected } = useAccount();


  const client = createPublicClient({
    chain: goerli,
    transport: http()
  })

  const [ensName, setEnsName] = useState(null);
  const [ensText, setEnsText] = useState(null);

  const getEnsName = async () => {
    const ensName = await client.getEnsName({
      address: address,
    })
    console.log(ensName)
    const ensText = await client.getEnsAvatar({
      name: normalize(ensName),
    });
    setEnsName(ensName)
    setEnsText(ensText)

  }

  getEnsName()


  return (
    <div className="App">
      <h1>NSFW Content Detection</h1>
      <h2>Upload a video to check for NSFW content</h2>


      <div
  className="App-header"
  style={{
    padding: "20px",
    border: "1px dashed gray",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  }}
>
  <div style={{ display: 'flex', alignItems: 'center', marginLeft: '10px' }}>
    <ConnectButton accountStatus={"avatar"} />
    {isConnected && (
      <div style={{ display: 'flex', alignItems: 'center', marginLeft: '10px' }}>
        <h4 style={{ marginRight: '10px' }}>ENS: {ensName}</h4>
        <img src={ensText} style={{ width: '48px', height: '75px' }} />
      </div>
    )}
  </div>
</div>


      {isConnected && <div>
        <div
          {...getRootProps()}
          style={{ padding: "20px", border: "1px dashed gray", marginTop: "30px" }}
        >
          <input {...getInputProps()} />
          <p>Drag and drop a file here, or click to select a file</p>
        </div>
        {droppedFileName && <p>File name: {droppedFileName}</p>}
        {loading && <p>Loading...</p>}
        {messages.map((message, index) => (
          <p key={index}>{message}</p>
        ))}
        {asset?.[0]?.playbackId && (
          <>
            <Player title={asset[0].name} playbackId={asset[0].playbackId} />
            <p>Playback ID: {asset[0].playbackId}</p>
          </>
        )}
        {rootCid && (
          <div>
            <a href={`https://${rootCid}.ipfs.w3s.link/`} target="_blank">Root CID</a>
          </div>
        )}
      </div>
      }

    </div >
  );
};

export default App;
