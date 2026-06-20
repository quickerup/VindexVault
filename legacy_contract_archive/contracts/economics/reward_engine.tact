contract RewardEngine {
    ownerAddress: Address;
    rateValue: Int = 1;
    accruedValue: Int = 0;

    init(owner: Address) {
        self.ownerAddress = owner;
    }

    receive("accrue") {
        self.accruedValue += self.rateValue;
    }

    get fun owner(): Address {
        return self.ownerAddress;
    }

    get fun rewardRate(): Int {
        return self.rateValue;
    }

    get fun accrued(): Int {
        return self.accruedValue;
    }
}
