import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber, Wallet } from "ethers";
import { SwappingAggregator, ERC20, MockUniswapV2Router } from "../typechain";
import { parseEther } from "ethers/lib/utils";

describe("SwappingAggregator", () => {
    let account0: Wallet,
        account1: Wallet,
        account2: Wallet,
        account1Bal: BigNumber,
        swappingAggregator: SwappingAggregator,
        routerV2_Mock: MockUniswapV2Router,
        usdc: ERC20,
        dai: ERC20,
        popoo: ERC20;

    beforeEach(async () => {
        const accounts = await ethers.getSigners();
        // @ts-ignore
        account0 = accounts[0];
        // @ts-ignore
        account1 = accounts[1];
        // @ts-ignore
        account2 = accounts[2];

        const amount = parseEther("100000000");

        swappingAggregator = <SwappingAggregator>(
            await (
                await ethers.getContractFactory("SwappingAggregator")
            ).deploy()
        );
        routerV2_Mock = <MockUniswapV2Router>(
            await (
                await ethers.getContractFactory("MockUniswapV2Router")
            ).deploy()
        );
        usdc = <ERC20>(
            await (
                await ethers.getContractFactory("MockErc20")
            ).deploy("USD Coin", "USDC", amount)
        );
        dai = <ERC20>(
            await (
                await ethers.getContractFactory("MockErc20")
            ).deploy("MAKER DAI", "DAI", amount)
        );
        popoo = <ERC20>(
            await (
                await ethers.getContractFactory("MockErc20")
            ).deploy("POPOO", "Popoo", amount)
        );

        await usdc.transfer(routerV2_Mock.address, amount.div(2));
        await dai.transfer(routerV2_Mock.address, amount.div(2));
        await popoo.transfer(routerV2_Mock.address, amount.div(2));

        account1Bal = amount.div(100);

        await usdc.transfer(account1.address, account1Bal);
        await dai.transfer(account1.address, account1Bal);
        await popoo.transfer(account1.address, account1Bal);
    });
    it("Should execute the swap successfully", async () => {
        await usdc
            .connect(account1)
            .approve(swappingAggregator.address, parseEther("100000000"));
        const inputUsdc = parseEther("10");
        const outputDai = parseEther("8");
        // create a callData array
        const callData = [
            {
                to: routerV2_Mock.address,
                data: routerV2_Mock.interface.encodeFunctionData(
                    "swapExactTokensForTokens",
                    [
                        inputUsdc,
                        outputDai,
                        [usdc.address, dai.address],
                        account1.address,
                        1773875703,
                    ]
                ),
            },
        ];

        await swappingAggregator.connect(account1).execute(callData);

        const usdcAfterSwap = await usdc.balanceOf(account1.address);
        const daiAfterSwap = await dai.balanceOf(account1.address);

        expect(usdcAfterSwap).to.equal(account1Bal.sub(inputUsdc));
        expect(daiAfterSwap).to.equal(account1Bal.add(outputDai));
    });

    it("Should execute the multiple swap successfully", async () => {
        await usdc
            .connect(account1)
            .approve(swappingAggregator.address, parseEther("100000000"));
        await dai
            .connect(account1)
            .approve(swappingAggregator.address, parseEther("100000000"));
        const inputUsdc = parseEther("10");
        const outputDai = parseEther("8");
        const outputPopoo = parseEther("5");
        // create a callData array
        const callData = [
            {
                to: routerV2_Mock.address,
                data: routerV2_Mock.interface.encodeFunctionData(
                    "swapExactTokensForTokens",
                    [
                        inputUsdc,
                        outputDai,
                        [usdc.address, dai.address],
                        account1.address,
                        1773875703,
                    ]
                ),
            },
            {
                to: routerV2_Mock.address,
                data: routerV2_Mock.interface.encodeFunctionData(
                    "swapExactTokensForTokens",
                    [
                        outputDai.mul(5),
                        outputPopoo,
                        [dai.address, popoo.address],
                        account1.address,
                        1773875703,
                    ]
                ),
            },
        ];

        await swappingAggregator.connect(account1).execute(callData);

        const usdcAfterSwap = await usdc.balanceOf(account1.address);
        const daiAfterSwap = await dai.balanceOf(account1.address);
        const poppoAfterSwap = await popoo.balanceOf(account1.address);

        expect(usdcAfterSwap).to.equal(account1Bal.sub(inputUsdc));
        expect(daiAfterSwap).to.equal(account1Bal.sub(outputDai.mul(4)));
        expect(poppoAfterSwap).to.equal(account1Bal.add(outputPopoo));
    });

    it("should revert if the selector is wrong", async () => {
        // create a callData array
        const callData = [
            {
                to: routerV2_Mock.address,
                data: usdc.interface.encodeFunctionData("transfer", [
                    account1.address,
                    parseEther("10"),
                ]),
            },
        ];
        await usdc
            .connect(account1)
            .approve(swappingAggregator.address, parseEther("100000000"));
        await expect(
            swappingAggregator.connect(account1).execute(callData)
        ).to.be.revertedWith("wrong selector passed");
    });

    it("Should revert if there  is empty callldata", async () => {
        // create a callData array
        const callData = [];
        await expect(
            swappingAggregator.connect(account1).execute(callData)
        ).to.be.revertedWith("callData 0 length");
    });

    it("Should not execute if input token is Zero Address", async () => {
        const inputUsdc = parseEther("10");
        const outputDai = parseEther("8");
        // create a callData array
        const callData = [
            {
                to: routerV2_Mock.address,
                data: routerV2_Mock.interface.encodeFunctionData(
                    "swapExactTokensForTokens",
                    [
                        inputUsdc,
                        outputDai,
                        [ethers.constants.AddressZero, dai.address],
                        account1.address,
                        1773875703,
                    ]
                ),
            },
        ];

        await expect(
            swappingAggregator.connect(account1).execute(callData)
        ).to.be.revertedWithoutReason();
    });

    it("Should revert if msg.sender has insufficient balance/and no approval", async () => {
        const inputUsdc = parseEther("10");
        const outputDai = parseEther("8");
        // create a callData array
        const callData = [
            {
                to: routerV2_Mock.address,
                data: routerV2_Mock.interface.encodeFunctionData(
                    "swapExactTokensForTokens",
                    [
                        inputUsdc,
                        outputDai,
                        [usdc.address, dai.address],
                        account2.address,
                        1773875703,
                    ]
                ),
            },
        ];

        // Without Approving
        await expect(
            swappingAggregator.connect(account1).execute(callData)
        ).to.be.revertedWith("ERC20: insufficient allowance");

        // now approving from account2, but account2 have 0 usdc amount
        await usdc
            .connect(account2)
            .approve(swappingAggregator.address, parseEther("100000000"));

        await expect(
            swappingAggregator.connect(account1).execute(callData)
        ).to.be.revertedWith("ERC20: insufficient allowance");

        // Now transfer some usdc to account2 and thenn it will successfully swapped
        await usdc.transfer(account2.address, account1Bal);

        await swappingAggregator.connect(account2).execute(callData);
    });

    it("should revert if the call to the 'to' address reverts", async () => {
        const inputUsdc = parseEther("10");
        const outputDai = parseEther("8");

        await usdc.approve(swappingAggregator.address, parseEther("100000000"));

        // create a callData array
        const callData = [
            {
                to: popoo.address,
                data: routerV2_Mock.interface.encodeFunctionData(
                    "swapExactTokensForTokens",
                    [
                        inputUsdc,
                        outputDai,
                        [usdc.address, dai.address],
                        account2.address,
                        1773875703,
                    ]
                ),
            },
        ];

        await expect(swappingAggregator.execute(callData)).to.be.revertedWith(
            "Error executing call"
        );
    });
});
