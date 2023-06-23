import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import {
  LivepeerConfig,
  createReactClient,
  studioProvider,
} from "@livepeer/react";

import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultWallets,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { goerli } from 'wagmi/chains';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import { BrowserRouter, Routes, Route } from "react-router-dom";


const { chains, publicClient } = configureChains(
  [goerli],
  [
    alchemyProvider({ apiKey: 'Sc60aItpz-CYksTrjGcicYJzBA8CBpJB' }),
    publicProvider()
  ]
);

const { connectors } = getDefaultWallets({
  appName: 'My RainbowKit App',
  projectId: 'YOUR_PROJECT_ID',
  chains
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient
})

const livepeerClient = createReactClient({
  provider: studioProvider({
    apiKey: "76831c0e-4b22-4db5-9867-45362ce2bb32",
  }),
});


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
    <LivepeerConfig client={livepeerClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
        </Routes>
      </BrowserRouter>

    </LivepeerConfig>
    </RainbowKitProvider>
    </WagmiConfig>
  </React.StrictMode>
);
