import { expect } from 'chai';
const { ethers } = require('hardhat');

const Web3 = require('web3');
const web3 = new Web3('http://127.0.0.1:8545');

describe('Hardhat', function () {
    const testCases = [
        {
            fork: 'https://pub001.hg.network/rpc',
            blockNumber: 8972228,
            target: {
                    _tx: 'https://hecoinfo.com/tx/0x619f194b29bb1b2dbf2e074e4a6d46ce57bd4bf44192842929ad166295644f28',

                    from: '0xc61003d097597f6f69a3cc94d615d8887d40ebec',
                    to: '0x7f88bc12aa1ed9ff4605123649ac90f2cd9407eb',
                    data: '0x38ed17390000000000000000000000000000000000000000000007f3f458a8a13f662c820000000000000000000000000000000000000000000001932e8e7f1335c3218c00000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000c61003d097597f6f69a3cc94d615d8887d40ebec000000000000000000000000000000000000000000000000000000006161fd5a00000000000000000000000000000000000000000000000000000000000000030000000000000000000000005fad6fbba4bba686ba9b8052cf0bd51699f38b930000000000000000000000005545153ccfca01fbd7dd11c0b23ba694d9509a6f000000000000000000000000a71edc38d189767582c38a3145b5873052c3e47a'
            },
        },
    ];

    for (const t of testCases) {
        describe(t.blockNumber.toString(), function () {
            describe('Before', function () {
                it('hardhat_reset', async function () {
                    const provider = new ethers.providers.JsonRpcProvider();
                    await provider.send('hardhat_reset', [
                        {
                            forking: {
                                jsonRpcUrl: t.fork,
                                blockNumber: t.blockNumber,
                            },
                        }
                    ]);

                    const block = await web3.eth.getBlock('latest');
                    expect(block.number).to.be.eq(t.blockNumber);
                });

                it(`target tx`, async function () {
                    const provider = new ethers.providers.JsonRpcProvider();
                    await provider.send('hardhat_impersonateAccount', [t.target.from]);

                    const frontRunTx = {
                        from: t.target.from,
                        to: t.target.to,
                        data: t.target.data,
                        gas: '1000000',
                        gasPrice: '1000000000'
                    };

                    const receipt = await web3.eth.sendTransaction(frontRunTx);
                    expect(receipt.status).to.be.eq(true);
                });
            });

            describe('Store', async function () {
                const Account = '0x20B9E822C02Bae423e13840094F20AF08e176B09';

                const StorageJson = require('../../build/contracts/Storage.json');
                const StorageContract = new web3.eth.Contract(StorageJson.abi);

                it('deploy', async function () {
                    const provider = new ethers.providers.JsonRpcProvider();
                    await provider.send('hardhat_impersonateAccount', [Account]);

                    const deployCall = StorageContract.deploy({
                        data: '0x' + StorageJson.data.bytecode.object,
                        arguments: [[]],
                    });

                    const deployCallTx = {
                        from: Account,
                        data: deployCall.encodeABI(),
                        gas: '5000000',
                        gasPrice: '1000000000'
                    };

                    const receipt = await web3.eth.sendTransaction(deployCallTx);
                    expect(receipt.status).to.be.eq(true);

                    StorageContract.options.address = receipt.contractAddress;
                });

                it('store 1234', async function () {
                    const receipt = await StorageContract.methods.store(1234).send({from: Account});
                    expect(receipt.status).to.be.eq(true);
                });

                it('retrieve', async function () {
                    const retrieve = await StorageContract.methods.retrieve().call();
                    expect(retrieve).to.be.eq('1234');
                });
            });
        });
    }
});

