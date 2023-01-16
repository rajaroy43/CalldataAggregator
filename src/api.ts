import express from "express";
import { ethers } from "ethers";
const UniswapV2Router02 = require("@uniswap/v2-periphery/build/IUniswapV2Router02.json");
import { IERC20 } from "../typechain";
const SwappingAggregator = require("../artifacts/contracts/SwappingAggregator.sol/SwappingAggregator.json");
const IERC_20 = require("../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json");
const { SwappingAggregatorAddress } = require("../DeployedAddress.json");
const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545/");

const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

const router = new ethers.Contract(
    routerAddress,
    UniswapV2Router02.abi,
    provider
);
const swappingAggregator = new ethers.Contract(
    SwappingAggregatorAddress,
    SwappingAggregator.abi,
    provider
);

const usdcAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const daiAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
// @ts-ignore
let usdcToken: IERC20 = new ethers.Contract(usdcAddress, IERC_20.abi, provider);
// @ts-ignore
const daiToken: IERC20 = new ethers.Contract(daiAddress, IERC_20.abi, provider);
// @ts-ignore
const wethToken: IERC20 = new ethers.Contract(
    wethAddress,
    IERC_20.abi,
    provider
);

const app = express();
app.use(express.json());

const toBytes32 = (bn: ethers.BigNumber) => {
    return ethers.utils.hexlify(ethers.utils.zeroPad(bn.toHexString(), 32));
};

const setStorageAt = async (address: string, index: any, value: any) => {
    await provider.send("hardhat_setStorageAt", [address, index, value]);
    await provider.send("evm_mine", []); // Just mines to the next block
};

app.post("/swap", async (req, res) => {
    const { privateKey } = req.body;
    const signer = new ethers.Wallet(privateKey, provider);

    const amountInUsdc = ethers.utils.parseEther("100000").div(1e12);
    const amountInDai = ethers.utils.parseEther("5000");

    // Setting some amount for user address
    await setStorageAt(
        usdcAddress,
        ethers.utils.solidityKeccak256(
            ["uint256", "uint256"],
            [signer.address, 9] // key, slot
        ),
        toBytes32(ethers.BigNumber.from(amountInUsdc)).toString()
    );

    await setStorageAt(
        daiAddress,
        ethers.utils.solidityKeccak256(
            ["uint256", "uint256"],
            [signer.address, 2] // key, slot
        ),
        toBytes32(ethers.BigNumber.from(amountInDai)).toString()
    );

    const swapUsdcToDaiData = router.interface.encodeFunctionData(
        "swapExactTokensForTokens",
        [amountInUsdc, 1, [usdcAddress, daiAddress], signer.address, 1773875703]
    );

    const swapDaiToWethData = router.interface.encodeFunctionData(
        "swapExactTokensForTokens",
        [amountInDai, 1, [daiAddress, wethAddress], signer.address, 1773875703]
    );

    console.log("My USDC Bal", await usdcToken.balanceOf(signer.address));
    console.log("My DAI Bal", await daiToken.balanceOf(signer.address));
    console.log("My WETH Bal", await wethToken.balanceOf(signer.address));
    // approving token to swapping aggregator
    await usdcToken
        .connect(signer)
        .approve(SwappingAggregatorAddress, amountInUsdc);
    await daiToken
        .connect(signer)
        .approve(SwappingAggregatorAddress, amountInDai);

    const callData = [
        {
            to: routerAddress,
            data: swapUsdcToDaiData,
        },
        {
            to: routerAddress,
            data: swapDaiToWethData,
        },
    ];

    try {
        const tx = await swappingAggregator.connect(signer).execute(callData);
        await tx.wait();
        console.log(
            "Updated USDC Bal",
            await usdcToken.balanceOf(signer.address)
        );
        console.log(
            "Updated DAI Bal",
            await daiToken.balanceOf(signer.address)
        );
        console.log(
            "Updated WETH Bal",
            await wethToken.balanceOf(signer.address)
        );
        res.status(200).json({ message: "Swap successful" });
    } catch (error: any) {
        res.status(500).json({
            message: "Error executing swap: " + error.message,
        });
    }
});

app.listen(3000, () => {
    console.log("Server started at http://localhost:3000");
});
