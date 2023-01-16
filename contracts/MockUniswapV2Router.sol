// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockUniswapV2Router {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        address tokenIn = path[0];
        address tokenOut = path[1];
        // Ensure the user has enough tokenIn to send to the router contract
        require(IERC20(path[0]).balanceOf(msg.sender) >= amountIn);

        // Transfer tokenIn from user to router contract
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);

        // Transfer tokenOut from user to router contract
        IERC20(tokenOut).transfer(to, amountOutMin);

        amounts = new uint256[](path.length);
        // The input token amount and all subsequent output token amounts.(Assuming only 2)
        amounts[0] = amountIn;
        amounts[1] = amountOutMin;
    }
}
