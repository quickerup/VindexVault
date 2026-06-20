contract Treasury {
    ownerAddress: Address;
    treasuryBalance: Int = 0;

    init(owner: Address) {
        self.ownerAddress = owner;
    }

    receive("fund") {
        self.treasuryBalance += 1;
    }

    get fun owner(): Address {
        return self.ownerAddress;
    }

    get fun balance(): Int {
        return self.treasuryBalance;
    }
}
