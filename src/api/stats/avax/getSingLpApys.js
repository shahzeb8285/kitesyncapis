//  const BigNumber = require('bignumber.js');
// const { MultiCall } = require('eth-multicall');
// const { avaxWeb3: web3, multicallAddress } = require('../../../utils/web3');

// const MasterChef = require('../../../abis/avax/SingChef.json');
// const ERC20 = require('../../../abis/ERC20.json');
// const fetchPrice = require('../../../utils/fetchPrice');
// const pools = require('../../../data/avax/singLpPools.json');
// const { BASE_HPY, AVAX_CHAIN_ID } = require('../../../constants');
// const { getTradingFeeAprJoe } = require('../../../utils/getTradingFeeApr');
// const getFarmWithTradingFeesApy = require('../../../utils/getFarmWithTradingFeesApy');
// const { joeClient } = require('../../../apollo/client');
// const { compound } = require('../../../utils/compound');

// const masterchef = '0xF2599B0c7cA1e3c050209f3619F09b6daE002857';
// const oracleId = 'SING';
// const oracle = 'tokens';
// const DECIMALS = '1e18';
// const secondsPerBlock = 1;
// const secondsPerYear = 31536000;

// const liquidityProviderFee = 0.0025;
// const beefyPerformanceFee = 0.045;
// const shareAfterBeefyPerformanceFee = 1 - beefyPerformanceFee;

// const getSingLPApys = async () => {
//   let apys = {};
//   let apyBreakdowns = {};

//   const tokenPrice = await fetchPrice({ oracle, id: oracleId });
//   const { rewardPerSecond, totalAllocPoint } = await getMasterChefData();
//   const { balances, allocPoints } = await getPoolsData(pools);

//   const pairAddresses = pools.map(pool => pool.address);
//   const tradingAprs = await getTradingFeeAprJoe(joeClient, pairAddresses, liquidityProviderFee);

//   for (let i = 0; i < pools.length; i++) {
//     const pool = pools[i];

//     const lpPrice = await fetchPrice({ oracle: 'lps', id: pool.name });
//     const totalStakedInUsd = balances[i].times(lpPrice).dividedBy('1e18');

//     const poolBlockRewards = rewardPerSecond.times(allocPoints[i]).dividedBy(totalAllocPoint);
//     const yearlyRewards = poolBlockRewards.dividedBy(secondsPerBlock).times(secondsPerYear);
//     const yearlyRewardsInUsd = yearlyRewards.times(tokenPrice).dividedBy(DECIMALS).dividedBy(2);

//     const simpleApy = yearlyRewardsInUsd.dividedBy(totalStakedInUsd);
//     const vaultApr = simpleApy.times(shareAfterBeefyPerformanceFee);
//     const vaultApy = compound(simpleApy, BASE_HPY, 1, shareAfterBeefyPerformanceFee);

//     const tradingApr = tradingAprs[pool.address.toLowerCase()] ?? new BigNumber(0);
//     const totalApy = getFarmWithTradingFeesApy(
//       simpleApy,
//       tradingApr,
//       BASE_HPY,
//       1,
//       shareAfterBeefyPerformanceFee
//     );
//     // console.log(pool.name, simpleApy.valueOf(), tradingApr.valueOf(), apy, totalStakedInUsd.valueOf(), yearlyRewardsInUsd.valueOf());

//     // Create reference for legacy /apy

//     const apy = compound(simpleApy, process.env.BASE_HPY, 1, 0.955);
//     const legacyApyValue = { [pool.name]: apy };

//     apys = { ...apys, ...legacyApyValue };

//     // Create reference for breakdown /apy
//     const componentValues = {
//       [pool.name]: {
//         vaultApr: vaultApr.toNumber(),
//         compoundingsPerYear: BASE_HPY,
//         beefyPerformanceFee: beefyPerformanceFee,
//         vaultApy: vaultApy,
//         lpFee: liquidityProviderFee,
//         tradingApr: tradingApr.toNumber(),
//         totalApy: totalApy,
//       },
//     };

//     apyBreakdowns = { ...apyBreakdowns, ...componentValues };
//   }

//   // Return both objects for later parsing
//   return {
//     apys,
//     apyBreakdowns,
//   };
// };

// const getMasterChefData = async () => {
//   const masterchefContract = new web3.eth.Contract(MasterChef, masterchef);
//   const rewardPerSecond = new BigNumber(await masterchefContract.methods.singPerSec().call());
//   const totalAllocPoint = new BigNumber(await masterchefContract.methods.totalAllocPoint().call());
//   return { rewardPerSecond, totalAllocPoint };
// };

// const getPoolsData = async pools => {
//   const masterchefContract = new web3.eth.Contract(MasterChef, masterchef);
//   const multicall = new MultiCall(web3, multicallAddress(AVAX_CHAIN_ID));
//   const balanceCalls = [];
//   const allocPointCalls = [];
//   pools.forEach(pool => {
//     const tokenContract = new web3.eth.Contract(ERC20, pool.address);
//     balanceCalls.push({
//       balance: tokenContract.methods.balanceOf(masterchef),
//     });
//     allocPointCalls.push({
//       allocPoint: masterchefContract.methods.poolInfo(pool.poolId),
//     });
//   });

//   const res = await multicall.all([balanceCalls, allocPointCalls]);

//   const balances = res[0].map(v => new BigNumber(v.balance));
//   const allocPoints = res[1].map(v => v.allocPoint['1']);
//   return { balances, allocPoints };
// };

// module.exports = getSingLPApys;



import { JOE_LPF } from '../../../constants';

const { getMasterChefApys } = require('../common/getMasterChefApys');
const { avaxWeb3 } = require('../../../utils/web3');
const pools = require('../../../data/avax/singLpPools.json');
import { joeClient } from '../../../apollo/client';

const getSingularApys = async () =>
  await getMasterChefApys({
    web3: avaxWeb3,
    chainId: 43114,
    masterchef: '0xF2599B0c7cA1e3c050209f3619F09b6daE002857',
    tokenPerBlock: 'singPerSec',
    hasMultiplier: false,
    pools: pools,
    oracleId: 'SING',
    oracle: 'tokens',
    decimals: '1e18',
    secondsPerBlock: 1,
    tradingFeeInfoClient: joeClient,
    liquidityProviderFee: JOE_LPF,
    // log: true,
  });


  module.exports = getSingularApys;
