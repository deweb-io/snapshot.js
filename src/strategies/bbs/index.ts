import { formatUnits } from '@ethersproject/units';
import { call, multicall } from '../../utils';

export const author = 'bbs';
export const version = '0.0.1';

const abis = [
  {
    "inputs": [],
    "name": "currentQuarter",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "staker",
        "type": "address"
      }
    ],
    "name": "getNumOfStakes",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "numOfStakes",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint16",
        "name": "",
        "type": "uint16"
      }
    ],
    "name": "shares",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Stacking contract address (or configured in space configuration)
const stackingContract = "";

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const currentQuarter = await call(
    provider,
    abis,
    [
      stackingContract,
      'currentQuarter',
      []
    ],
    { blockTag }
  );

  const numberOfStakes = await multicall(
    network,
    provider,
    abis,
    addresses.map((address:any) => [
      stackingContract,
      'getNumOfStakes',
      [address]
    ]),
     { blockTag }
  );

  const response = await Promise.all(
    numberOfStakes.map((numOfStakes) =>
      multicall(
        network,
        provider,
        abis,
        Array(numOfStakes).fill(0).map((_,index) => [
          stackingContract,
          'shares',
          [addresses[index], index, currentQuarter]
        ])
      ))
  );

  return Object.fromEntries(
      addresses.map((address:any, index) =>
        [address, response[index].map((shares) => shares.toNumber()).reduce((total, current) => total + current, 0)]));
}
