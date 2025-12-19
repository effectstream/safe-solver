const accountMessages = {
    linkAccount: (
      account_id: number,
      other_address: WalletAddress,
      is_new_primary: boolean,
    ) => {
      return `link:${String(account_id)}:${other_address}:${
        is_new_primary ? "true" : "false"
      }`;
    },
    unlinkAccountWithPrimary: (
      account_id: number,
      other_address: WalletAddress,
      new_primary?: WalletAddress | null,
    ) => {
      return `unlink:${String(account_id)}:${other_address}:${new_primary ?? ""}`;
    },
  };

export const accountPayload = {
    createAccount: async () => {
      return ['&createAccount'];
    },

    linkAddress: async (
      mainWallet: { provider: { getAddress: () => Promise<{ address: string, type: number }>, signMessage: (message: string) => Promise<string> } },
      secondaryWallet: { provider: { getAddress: () => Promise<{ address: string, type: number }>, signMessage: (message: string) => Promise<string> } },

      accountId: number,
      isNewPrimary: boolean,
    ): Promise<['&linkAddress', number, string, number, string, string, number, boolean]> => {  
      const mainWalletAddress = await mainWallet.provider.getAddress();
      const secondaryWalletAddress = await secondaryWallet.provider.getAddress();

      const signatureFromMainWallet = await mainWallet.provider.signMessage(
        accountMessages.linkAccount(
          accountId,
          secondaryWalletAddress.address,
          isNewPrimary,
        ),
      );
  
      const signatureFromSecondaryWallet = await secondaryWallet.provider.signMessage(
        accountMessages.linkAccount(
          accountId,
          mainWalletAddress.address,
          isNewPrimary,
        ),
      );
  
      return [
        "&linkAddress",
        accountId,

        signatureFromMainWallet,
        mainWalletAddress.type,

        secondaryWalletAddress.address,
        signatureFromSecondaryWallet,
        secondaryWalletAddress.type,

        isNewPrimary,
      ];
    },
    // unlinkSelf: async (
    //   accountId: number,
    // ): Promise<['&unlinkAddress', number, string, number, string, number, string, number]> => {
    //   return [
    //     BuiltinGrammarPrefix.unlinkAddress,
    //     accountId,
    //     "",
    //     -1,
    //     "",
    //     -1,
    //     "",
    //     -1,
    //   ];
    // },
    // // TODO This should use the Wallet connector to sign the message
    // unlinkAddress: async (
    //   primaryAccountPrivateKey: PrivateKey,
    //   primaryAccountAddressType: AddressType,
    //   accountId: number,
    //   _targetAddress: WalletAddress,
    //   targetAddressType: AddressType,
    //   _newPrimary: WalletAddress | null,
    //   newPrimaryType: AddressType | null,
    // ): Promise<['&unlinkAddress', number, string, number, string, number, string, number]> => {
    //   const targetCryptoManager = CryptoManager.getCryptoManager(targetAddressType);
    //   const targetAddress = targetCryptoManager.decodeAddress(_targetAddress);
    //   let newPrimaryAddress: WalletAddress | null = null;
    //   if (_newPrimary && newPrimaryType !== null) {
    //     const newPrimaryCryptoManager = CryptoManager.getCryptoManager(newPrimaryType);
    //     newPrimaryAddress = newPrimaryCryptoManager.decodeAddress(_newPrimary);
    //   }
    //   const signatureFromPrimary = await signMessage(
    //     accountMessages.unlinkAccountWithPrimary(
    //       accountId,
    //       targetAddress,
    //       newPrimaryAddress,
    //     ),
    //     primaryAccountPrivateKey,
    //   );
  
    //   return [
    //     BuiltinGrammarPrefix.unlinkAddress,
    //     accountId,
    //     signatureFromPrimary,
    //     primaryAccountAddressType,
    //     targetAddress,
    //     targetAddressType,
    //     newPrimaryAddress ?? "",
    //     newPrimaryType ?? -1,
    //   ];
    // },
  };
  