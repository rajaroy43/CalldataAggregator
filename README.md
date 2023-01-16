Run `npm install` or `yarn` and then:

- `yarn compile` - to compile smart contract and generate typechain ts bindings
- `yarn test` - to run tests
- `yarn deploy` - to deploy to local network (see options for more)
- `yarn node` - to run a localhost node
- `yarn fork_node` - to run a forked node
- `yarn api` - to run a api-server, for crafting calldata
- `curl -X POST -H "Content-Type: application/json" -d '{"privateKey": "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"}' http://127.0.0.1:3000/swap ` - to post api (Here private key is default hardhat private key)

## Demo

First create `.env` in root directory  and add your alchemy mainnet key there ,get format from `.env.example`  

1. run `yarn fork_node` - It will fork the node ,and automatically deploy the contract
2. run `yarn api` - It will run a api-server 
3. run `curl -X POST -H "Content-Type: application/json" -d '{"privateKey": "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"}' http://127.0.0.1:3000/swap ` - to post api (Here private key is default hardhat private key) on CMD or powershell

and now you will get response as {"message":"Swap successful"} 
