import { ethers, providers } from "ethers";
import Transfer from "./Transfer";
import { ChainId } from "@biconomy/core-types";
import SocialLogin from "@biconomy/web3-auth";
import {
  BiconomySmartAccountV2,
  BiconomySmartAccountV2Config,
} from "@biconomy/account";
import { bundler, paymaster } from "@/constants";
import { Fragment, useEffect, useRef, useState } from "react";

export default function Wallet() {
  const sdkRef = useRef<SocialLogin | null>(null);
  const [interval, enableInterval] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [, setProvider] = useState<providers.Web3Provider>();
  const [smartAccount, setSmartAccount] = useState<BiconomySmartAccountV2>();

  useEffect(() => {
    let configureLogin: NodeJS.Timeout | undefined;
    if (interval) {
      configureLogin = setInterval(() => {
        if (!!sdkRef.current?.provider) {
          setupSmartAccount();
          clearInterval(configureLogin);
        }
      }, 1000);
    }
    return () => {
      if (configureLogin) clearInterval(configureLogin);
    };
  }, [interval]);

  async function login() {
    if (!sdkRef.current) {
      const socialLoginSDK = new SocialLogin();
      await socialLoginSDK.init({
        chainId: ethers.utils.hexValue(ChainId.SEPOLIA).toString(),
        network: "testnet",
      });
      sdkRef.current = socialLoginSDK;
    }

    if (!sdkRef.current.provider) {
      sdkRef.current.showWallet();
      enableInterval(true);
    } else {
      console.log("Hello");
      setupSmartAccount();
    }
  }

  async function setupSmartAccount() {
    try {
      if (!sdkRef.current?.provider) return;
      sdkRef.current.hideWallet();
      setLoading(true);
      let web3Provider = new ethers.providers.Web3Provider(
        sdkRef.current.provider
      );

      setProvider(web3Provider);
      const config: BiconomySmartAccountV2Config = {
        signer: web3Provider.getSigner(),
        chainId: ChainId.SEPOLIA,
        bundler: bundler,
        paymaster: paymaster,
      };
      const smartAccount = new BiconomySmartAccountV2(config);
      await smartAccount.init();

      setSmartAccount(smartAccount);
    } catch (e) {
      console.error(e);
    }

    setLoading(false);
  }

  async function logOut() {
    await sdkRef.current?.logout();
    sdkRef.current?.hideWallet();
    setSmartAccount(undefined);
    enableInterval(false);
  }

  return (
    <Fragment>
      {/* Logout Button */}
      {smartAccount && (
        <button
          onClick={logOut}
          className="absolute right-0 m-3 rounded-lg bg-gradient-to-r from-green-400 to-blue-500 px-4 py-2 font-medium transition-all hover:from-green-500 hover:to-blue-600 "
        >
          Logout
        </button>
      )}

      <div className="m-auto flex h-screen flex-col items-center justify-center gap-10 bg-gray-950">
        <h1 className=" text-4xl text-gray-50 font-bold tracking-tight lg:text-5xl">
          Send ERC20 using ERC20
        </h1>

        {/* Login Button */}
        {!smartAccount && !loading && (
          <button
            onClick={login}
            className="mt-10 rounded-lg bg-gradient-to-r from-green-400 to-blue-500 px-4 py-2 font-medium  transition-colors hover:from-green-500 hover:to-blue-600"
          >
            Login
          </button>
        )}

        {/* Loading state */}
        {loading && <p>Loading account details...</p>}

        {smartAccount && (
          <Fragment><Transfer smartAccount={smartAccount} /></Fragment>
        )}
      </div>
    </Fragment>
  );
}
