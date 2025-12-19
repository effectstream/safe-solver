import { AddressType } from "@paimaexample/utils";
const BATCHER_URL = "http://localhost:3334";
export async function sendMintToBatcher(
  input_: string,
  confirmationLevel: string = "no-wait",
): Promise<number> {
  const input = JSON.stringify({
    circuit: "storeValue",
    args: [input_],
  });
  const body = {
    data: {
      target: "midnightAdapter_unshielded_erc20",
      address: "placeholderaddress",
      addressType: AddressType.MIDNIGHT,
      input,
      timestamp: Date.now(),
    },
    confirmationLevel: confirmationLevel,
  };
  const response = await fetch(`${BATCHER_URL}/send-input`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (response.ok) {
    console.log("Mint sent to batcher successfully");
  } else {
    console.error("[ERROR] Sending mint to batcher:", result);
  }
  return response.status;
}

sendMintToBatcher(100).then((status) => {
  console.log("Mint sent to batcher successfully", status);
}).catch((error) => {
  console.error("Error sending mint to batcher", error);
});