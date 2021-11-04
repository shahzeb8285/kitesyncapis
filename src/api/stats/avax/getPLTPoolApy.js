const BigNumber = require('bignumber.js');
const { avaxWeb3: web3 } = require('../../../utils/web3');

const MasterChef = require('../../../abis/pltMasterChef.json');
const fetchPrice = require('../../../utils/fetchPrice');
const { getTotalStakedInUsd } = require('../../../utils/getTotalStakedInUsd');
const { compound } = require('../../../utils/compound');
const { AVAX_CHAIN_ID } = require('../../../constants');
const getBlockNumber = require('../../../utils/getBlockNumber');

const getPLTPoolApy = async () => {

  const masterChef = '0x96634DbA8Ea2d9cF2a9B5F6Ee1eCE60900E89F2a';
  const plt = '0xeCfE536a209e405Db19887830b366E397f5B917a';
  const oracle = 'tokens';
  const oracleId = 'PLT';

  const [yearlyRewardsInUsd, totalStakedInUsd] = await Promise.all([
    getYearlyRewardsInUsd(masterChef, oracle, oracleId),
    getTotalStakedInUsd(masterChef, plt, oracle, oracleId,"1e18",43114),
  ]);


  const simpleApy = yearlyRewardsInUsd.dividedBy(totalStakedInUsd);
  console.log("simpleApy",simpleApy)
  // const apy = compound(simpleApy, process.env.BASE_HPY, 1, 0.94);
  return { 'plt-plt': simpleApy.toNumber() };
};

const getYearlyRewardsInUsd = async (masterChefAddr, oracle, oracleId) => {
  const fromBlock = await getBlockNumber(AVAX_CHAIN_ID);
  const toBlock = fromBlock + 1;
  const masterChefContract = new web3.eth.Contract(MasterChef, masterChefAddr);

  const multiplier = new BigNumber(
    await masterChefContract.methods.getMultiplier(fromBlock, toBlock).call()
  );
  const blockRewards = new BigNumber(await masterChefContract.methods.pltPerBlock().call());

  let { allocPoint } = await masterChefContract.methods.poolInfo(0).call();
  allocPoint = new BigNumber(allocPoint);

  const totalAllocPoint = new BigNumber(await masterChefContract.methods.totalAllocPoint().call());
  const poolBlockRewards = blockRewards
    .times(multiplier)
    .times(allocPoint)
    .dividedBy(totalAllocPoint);

  const secondsPerBlock = 3;
  const secondsPerYear = 31536000;
  const yearlyRewards = poolBlockRewards.dividedBy(secondsPerBlock).times(secondsPerYear);

  const pltPrice = await fetchPrice({ oracle, id: oracleId });
  const yearlyRewardsInUsd = yearlyRewards.times(pltPrice).dividedBy('1e18');

  return yearlyRewardsInUsd;
};

module.exports = getPLTPoolApy;
