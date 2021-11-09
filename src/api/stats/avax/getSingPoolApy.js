const BigNumber = require('bignumber.js');
const { avaxWeb3: web3 } = require('../../../utils/web3');

const MasterChef = require('../../../abis/avax/SingChef.json');
const fetchPrice = require('../../../utils/fetchPrice');
const { getTotalStakedInUsd } = require('../../../utils/getTotalStakedInUsd');
const { compound } = require('../../../utils/compound');
const { AVAX_CHAIN_ID } = require('../../../constants');
const getBlockNumber = require('../../../utils/getBlockNumber');

const getSingPoolApy = async () => {

  const masterChef = '0xF2599B0c7cA1e3c050209f3619F09b6daE002857';
  const sing = '0xF9A075C9647e91410bF6C402bDF166e1540f67F0';
  const oracle = 'tokens';
  const oracleId = 'SING';

  const [yearlyRewardsInUsd, totalStakedInUsd] = await Promise.all([
    getYearlyRewardsInUsd(masterChef, oracle, oracleId),
    getTotalStakedInUsd(masterChef, sing, oracle, oracleId,"1e18",43114),
  ]);


  const simpleApy = yearlyRewardsInUsd.dividedBy(totalStakedInUsd);
  console.log("simpleApy",simpleApy)
  // const apy = compound(simpleApy, process.env.BASE_HPY, 1, 0.94);
  return { 'sing-sing': simpleApy.toNumber() };
};

const getYearlyRewardsInUsd = async (masterChefAddr, oracle, oracleId) => {
  const fromBlock = await getBlockNumber(AVAX_CHAIN_ID);
  const toBlock = fromBlock + 1;
  const masterChefContract = new web3.eth.Contract(MasterChef, masterChefAddr);

  const multiplier = new BigNumber(
    await masterChefContract.methods.getMultiplier(fromBlock, toBlock).call()
  );
  const blockRewards = new BigNumber(await masterChefContract.methods.singPerSec().call());

  let { allocPoint } = await masterChefContract.methods.poolInfo(2).call();
  allocPoint = new BigNumber(allocPoint);

  const totalAllocPoint = new BigNumber(await masterChefContract.methods.totalAllocPoint().call());
  const poolBlockRewards = blockRewards
    .times(multiplier)
    .times(allocPoint)
    .dividedBy(totalAllocPoint);

  const secondsPerYear = 31536000;
  const yearlyRewards = poolBlockRewards.times(secondsPerYear);

  const singPrice = await fetchPrice({ oracle, id: oracleId });
  const yearlyRewardsInUsd = yearlyRewards.times(singPrice).dividedBy('1e18');

  return yearlyRewardsInUsd;
};

module.exports = getSingPoolApy;
