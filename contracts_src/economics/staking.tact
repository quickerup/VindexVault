contract Staking {
    ownerAddress: Address;
    stakedTotal: Int = 0;

    init(owner: Address) {
        self.ownerAddress = owner;
    }

    receive("stake") {
        self.stakedTotal += 1;
    }

    get fun owner(): Address {
        return self.ownerAddress;
    }

    get fun totalStaked(): Int {
        return self.stakedTotal;
    }
}
