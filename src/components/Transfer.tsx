import { BiconomySmartAccount } from "@biconomy/account";
import { useEffect, useState } from "react";

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
}