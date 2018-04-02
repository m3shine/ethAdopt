
var Adoption = artifacts.require('./Adoption.sol')
var TokenSB = artifacts.require('./TokenSB.sol')

module.exports = function (deployer) {
    deployer.deploy(Adoption)
    deployer.deploy(TokenSB, 20 * Math.pow(10, 8), "傻币", "SB")
}
