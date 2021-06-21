import { formatUnits } from '@ethersproject/units';
import { call, multicall } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';

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

// Stacking contract address
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

  /**
  * numberOfStakes is [s1, s2, s3, ....., sN]
  * numberOfStakes[0] --> address0, numberOfStakes[1] --> address1, ..., numberOfStakes[n] --> addressN
  */
  const numberOfStakes:Array<BigNumber> = await multicall(
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

  /**
  * shares is [[s1,s2,s3,..sN], [s1,s2,s3,..sN],..., [s1,s2,s3,..sN]]
  * shares[0] --> address1,...,[s1,s2,s3,..sN] --> addressN
  */
  const shares:Array<Array<BigNumber>> = await Promise.all(
    numberOfStakes.map((numOfStakes) =>
      multicall(
        network,
        provider,
        abis,
        Array(numOfStakes.toNumber()).fill(0).map((_,index) => [
          stackingContract,
          'shares',
          [addresses[index], index, currentQuarter],
          { blockTag }
        ]),
        { blockTag }
      ))
  );

  return Object.fromEntries(
      addresses.map((address:any, index:number) =>
        [address, shares[index].map((shares) =>
          shares.toNumber()).reduce((total, current) => total + current, 0)]));
}
