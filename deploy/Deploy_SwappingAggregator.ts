import fs from "fs";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const tx = await deploy("SwappingAggregator", {
        from: deployer,
    });
    console.log("SwappingAggregator Address", tx.address);
    const data = {
        SwappingAggregatorAddress: tx.address,
    };
    fs.writeFile("DeployedAddress.json", JSON.stringify(data), (err) => {
        if (err) {
            console.error(err);
        }
    });
};
export default func;
