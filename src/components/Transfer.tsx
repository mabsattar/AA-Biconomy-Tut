import { BiconomySmartAccount } from "@biconomy/account";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { USDC_CONTRACT_ADDRESS, ERC20ABI, paymaster } from "@/constants";
import {
  IHybridPaymaster,
  PaymasterMode,
  SponsorUserOperationDto,
} from "@biconomy/paymaster";

export default function Transfer({
  smartAccount,
}: {
  smartAccount: BiconomySmartAccount;
}) {
  const [smartContractAddress, setSmartContractAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState(0);
  const [recipient, setRecipient] = useState("");

  async function getSmartContractAddress() {
    const smartContractAddress = await smartAccount.getSmartAccountAddress();
    setSmartContractAddress(smartContractAddress);
  }

  // Get the address of the smart account when the component loads
  useEffect(() => {
    getSmartContractAddress();
  }, []);
  

  async function transfer() {
    try{
      //initiate the loading state
      setIsLoading(true);

      const readProvider = smartAccount.provider;
      const tokenContract = new ethers.Contract(
        ERC20ABI,
        readProvider,
      );

      const decimals = await tokenContract.decimals();
      const amountInLowestUnit = ethers.utils.parseUnits(
        amount.toString(),
        decimals
      );

      const populatedTransferTxn = 
        await tokenContract.populateTransaction.transfer(
          recipient,
          amountInLowestUnit
        );
      const calldata = populatedTransferTxn.data;

      const userOp = await smartAccount.buildUserOp([
        {
          to: USDC_CONTRACT_ADDRESS,
          data: calldata,
        },
      ]);
      const biconomyPaymaster = smartAccount.paymaster as IHybridPaymaster<SponsorUserOperationDto>;
      const freeQuotesResponse = await biconomyPaymaster.getPaymasterFeeQuotesOrData(userOp, {
        mode: PaymasterMode.ERC20,
        tokenList:[],
        preferredToken: USDC_CONTRACT_ADDRESS,
      });
      const freeQuote = freeQuotesResponse.feeQuotes;
      if (!freeQuote) throw new Error("Could not fetch free quote in USDC");

      const spender = freeQuotesResponse.tokenPaymasterAddress || "";
      const selectedFreeQuote = freeQuote[0];

      //Build the paymaster userOp
      let finalUserOp = await smartAccount.buildTokenPaymasterUserOp(userOp, {
        freeQuote: selectedFreeQuote,
        spender: spender,
        maxApproval: true,
      });

      //get the calldata for the paymaster
      const paymasterServiceData = {
        mode: PaymasterMode.ERC20,
        feeTokenAddress: USDC_CONTRACT_ADDRESS,
        calculateGasLimits: true,
      };

      const paymasterAndDataResponse = await biconomyPaymaster.getPaymasterAndData(
        finalUserOp,
        paymasterServiceData
      );
      finalUserOp.paymasterAndData = paymasterAndDataResponse.paymasterAndData;

      if(
        paymasterAndDataResponse.callGasLimit &&
        paymasterAndDataResponse.verificationGasLimit &&
        paymasterAndDataResponse.preVerificationGas
      ) {
        //returned gqas limits must be replaced in your op as you update paymasterAndData.
        //because these are the limits paymaster service signed on to generate paymasterAndData

        finalUserOp.callGasLimit = paymasterAndDataResponse.callGasLimit;
        finalUserOp.verificationGasLimit = paymasterAndDataResponse.verificationGasLimit;
        finalUserOp.preVerificationGas = paymasterAndDataResponse.preVerificationGas;
      }
      //send the userOperation
      const userOpResponse = await smartAccount.sendUserOp(finalUserOp);
      const receipt = await userOpResponse.wait();

      console.log(`Transaction receipt: ${JSON.stringify(receipt, null, 2)}`);
      window.alert("Transaction successful!")

    } catch(error) {
      console.log(error);
    }
    setIsLoading(false);
  }

  return (
    <div>
      <p className="text-sm">
        {" "}
        Your smart account address is : {smartContractAddress}
      </p>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div>
          <p>Transfer tokens from your account to another :</p>
          <div className="mt-5  flex w-auto flex-col gap-2">
            <input
              className="rounded-xl border-2 p-1 text-gray-500"
              type="text"
              placeholder="Enter address"
              onChange={(e) => setRecipient(e.target.value)}
            />
            <input
              className="rounded-xl border-2 p-1 text-gray-500"
              type="number"
              placeholder="Enter amount"
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            <button
              className="w-32 rounded-lg bg-gradient-to-r from-green-400 to-blue-500 px-4 py-2 font-medium transition-all hover:from-green-500 hover:to-blue-600"
              onClick={transfer}
            >
              Transfer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}