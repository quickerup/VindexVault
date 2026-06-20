contract JettonWallet {
    ownerAddress: Address;
    walletBalance: Int = 0;

    init(owner: Address) {
        self.ownerAddress = owner;
    }

    receive("deposit") {
        self.walletBalance += 1;
    }

    get fun owner(): Address {
        return self.ownerAddress;
    }

    get fun balance(): Int {
        return self.walletBalance;
    }
}
