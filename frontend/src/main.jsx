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

const CustomAvatar = ({ address, ensImage, size }) => {
  const color = generateColorFromAddress(address);
  return ensImage ? (
    <img
      src={ensImage}
      width={size}
      height={size}
      style={{ borderRadius: 999 }}
    />
  ) : (
    <div
      style={{
        backgroundColor: color,
        borderRadius: 999,
        height: size,
        width: size,
      }}
    >
      :^)
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <WagmiConfig config={wagmiConfig} avatar={CustomAvatar}>
      <RainbowKitProvider chains={chains}>
        <LivepeerConfig client={livepeerClient}>
          <App />
        </LivepeerConfig>
      </RainbowKitProvider>
    </WagmiConfig>
  </React.StrictMode>
);
