// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SwappingAggregator {
    struct Calls {
        address to;
        bytes data;
    }

    function _decodeData(bytes memory data)
        internal
        pure
        returns (
            bytes4 selector,
            uint256 amountIn,
            address tokenIn
        )
    {
        assembly {
            // load 32 bytes into `selector` from `data` skipping the first 32 bytes
            selector := mload(add(data, 32))
            amountIn := mload(add(data, 36))
            // amountOutMin := mload(add(data, 68))
            // Skipping argument count(32 bytes + previous amountOutMin(68+32))
            // offset := mload(add(data, 100))
            // to := mload(add(data, 132))
            // deadline := mload(add(data, 164))
            let pathLen := mload(add(data, 196))

            // Getting first input token
            // tokenIn is path[0]
            let offset := add(mul(0, 0x20), 196)
            tokenIn := mload(add(data, add(offset, 32)))
        }
    }

    function execute(Calls[] memory callData) public {
        require(callData.length > 0, "callData 0 length");
        for (uint256 i = 0; i < callData.length; i++) {
            bytes4 swapExactTokensForTokensSelector = bytes4(
                keccak256(
                    bytes(
                        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)"
                    )
                )
            );
            (bytes4 selector, uint256 amountIn, address tokenIn) = _decodeData(
                callData[i].data
            );
            require(
                selector == swapExactTokensForTokensSelector,
                "wrong selector passed"
            );
            IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
            IERC20(tokenIn).approve(callData[i].to, amountIn);
            (bool success, bytes memory returnData) = callData[i].to.call(
                callData[i].data
            );
            require(success, "Error executing call");
        }
    }
}
