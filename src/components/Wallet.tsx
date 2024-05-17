import {useEffect, useRef, useState} from 'react';
import { ethers } from "ethers";
import { ChainId } from "@biconomy/core-types";

export default function Wallet() {
    const sdkRef = useRef<SocialLogin | null>(null);
    const [interval, enableInterval] = useState<boolean>(false);

    useEffect(() => {
        let configureLogin: NodeJS.Timeout | undefined;
        if (interval) {
            configureLogin = setInterval(() => {
                if (!!sdkRef.current?.provider) {
                    clearInterval(configureLogin);
                }
            }, 1000);
        }
    }, [interval]);

    async function login() {
        if (!sdkRef.current) {
            const socialLoginSDK = new SocialLogin();
            await socialLoginSDK.init({
                chainId: ethers.utils.hexValue(chainId.POLYGON_MUMBAI).toString(),
                network: "testnet",
            });
            sdkRef.current = socialLoginSDK;
        }

        if (!sdkRef.current.provider) {
            sdkRef.current.showWallet();
            enableInterval(true);
        } else {
            console.log("Hello");
        }

        async function setupSmartAccount() {
            try {
              if (!sdkRef.current?.provider) return;          
              sdkRef.current.hideWallet();          
              setLoading(true);          
              let web3Provider = new ethers.providers.Web3Provider(
                sdkRef.current?.provider
              );
              
              setProvider(web3Provider);
              const config: BiconomySmartAccountConfig = {
                signer: web3Provider.getSigner(),
                chainId: ChainId.POLYGON_MUMBAI,
                bundler: bundler,
                paymaster: paymaster,
              };
              const smartAccount = new BiconomySmartAccount(config);
              await smartAccount.init();

              setSmartAccount(smartAccount);
            } catch (e) {
              console.error(e);
            }
          
            setLoading(false);
          }
    }

      
    
      return (
        <div>Wallet</div>
      )
    
    
    export default Wallet
}
