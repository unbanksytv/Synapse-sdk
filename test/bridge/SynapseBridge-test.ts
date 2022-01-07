import {expect} from "chai";
import {before, Done} from "mocha";
import {step} from "mocha-steps";

import {
    ChainId,
    Networks,
    Token,
    Tokens,
    Bridge
} from "../../src";

import {Zero} from "@ethersproject/constants";
import {PopulatedTransaction} from "@ethersproject/contracts";
import {TransactionResponse} from "@ethersproject/providers";
import {BigNumber} from "@ethersproject/bignumber";

import {
    PROVIDER_BSC,
    PROVIDER_ETHEREUM,
    PROVIDER_FANTOM,
    PROVIDER_BOBA,
    PROVIDER_MOONRIVER,
    PROVIDER_OPTIMISM,
    makeWalletSignerWithProvider,
} from "../helpers";
import {parseEther} from "@ethersproject/units";

// Completely clean privkey with low balances.
const bridgeTestPrivkey: string = "67544261a018b8a4e55261b3a30a018ebf83f508a5c87898b03eef57ea0a30d5";

const testChains = [PROVIDER_ETHEREUM, PROVIDER_OPTIMISM, PROVIDER_BSC, PROVIDER_FANTOM, PROVIDER_BOBA, PROVIDER_MOONRIVER];

function doneWithError(e: any, done: Done) {
    done(e instanceof Error ? e : new Error(e));
}

describe("SynapseBridge", function() {
    describe("read-only wrapper functions", function(this: Mocha.Suite) {
        describe(".bridgeVersion()", function(this: Mocha.Suite) {
            this.timeout(8*1000);

            const expected = 6;

            testChains.forEach((provider) => {
                let bridgeInstance = new Bridge.SynapseBridge({ network: provider.chainId, provider: provider.provider });

                it(`Should return ${expected.toString()} on Chain ID ${provider.chainId}`, function(done) {
                    expect(
                        bridgeInstance.bridgeVersion().then((res: BigNumber) => res.toNumber())
                    ).to.eventually.equal(expected)
                        .notify(done);
                })
            })
        })

        describe(".WETH_ADDRESS", function(this: Mocha.Suite) {
            this.timeout(10*1000);

            testChains.forEach(({ chainId: network, provider }) => {
                let bridgeInstance = new Bridge.SynapseBridge({ network, provider });
                let expected: string;
                switch (network) {
                    case ChainId.ETH:
                        expected = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
                        break;
                    case ChainId.BOBA:
                        expected = "0xd203De32170130082896b4111eDF825a4774c18E";
                        break;
                    case ChainId.OPTIMISM:
                        expected = "0x121ab82b49B2BC4c7901CA46B8277962b4350204";
                        break;
                    default:
                        expected = "0x0000000000000000000000000000000000000000";
                        break;
                }

                it(`Should return ${expected} for Chain ID ${network}`, function(done: Done) {
                    expect(bridgeInstance.WETH_ADDRESS())
                        .to.eventually.equal(expected)
                        .notify(done)
                })
            })
        })

        describe("checkSwapSupported", function(this: Mocha.Suite) {
            interface TestArgs {
                chainIdFrom: number,
                chainIdTo:   number,
                tokenFrom:   Token,
                tokenTo:     Token,
            }

            interface TestCase {
                args:     TestArgs,
                expected: boolean,
            }

            const makeTestCase = (chainIdFrom: number, tokenFrom: Token, chainIdTo: number, tokenTo: Token, expected: boolean): TestCase => {
                return {args: {chainIdFrom, tokenFrom, chainIdTo, tokenTo}, expected}
            }

            let testCases: TestCase[] = [
                makeTestCase(ChainId.ETH,       Tokens.DAI,    ChainId.BSC,       Tokens.USDC, true),
                makeTestCase(ChainId.ETH,       Tokens.ETH,    ChainId.BSC,       Tokens.USDC, false),
                makeTestCase(ChainId.ARBITRUM,  Tokens.WETH,   ChainId.ETH,       Tokens.ETH,  true),
                makeTestCase(ChainId.ARBITRUM,  Tokens.WETH,   ChainId.AVALANCHE, Tokens.ETH,  true),
                makeTestCase(ChainId.AVALANCHE, Tokens.SYN,    ChainId.BSC,       Tokens.SYN,  true),
                makeTestCase(ChainId.POLYGON,   Tokens.MIM,    ChainId.BSC,       Tokens.USDT, false),
                makeTestCase(ChainId.FANTOM,    Tokens.MIM,    ChainId.BSC,       Tokens.USDT, true),
                makeTestCase(ChainId.BOBA,      Tokens.MIM,    ChainId.ETH,       Tokens.MIM,  false),
                makeTestCase(ChainId.ETH,       Tokens.ETH,    ChainId.BOBA,      Tokens.NETH, false),
                makeTestCase(ChainId.ETH,       Tokens.ETH,    ChainId.BOBA,      Tokens.ETH,  false),
                makeTestCase(ChainId.BOBA,      Tokens.ETH,    ChainId.ETH,       Tokens.ETH,  false),
                makeTestCase(ChainId.BOBA,      Tokens.ETH,    ChainId.ETH,       Tokens.NETH, false),
                makeTestCase(ChainId.ETH,       Tokens.ETH,    ChainId.BOBA,      Tokens.USDT, false),
                makeTestCase(ChainId.ETH,       Tokens.NETH,   ChainId.BOBA,      Tokens.USDC, false),
                makeTestCase(ChainId.BOBA,      Tokens.ETH,    ChainId.ETH,       Tokens.USDT, false),
                makeTestCase(ChainId.BOBA,      Tokens.NETH,   ChainId.ETH,       Tokens.USDC, false),
                makeTestCase(ChainId.BOBA,      Tokens.USDC,   ChainId.ETH,       Tokens.USDT, true),
                makeTestCase(ChainId.ETH,       Tokens.USDT,   ChainId.ETH,       Tokens.USDC, true),
                makeTestCase(ChainId.BOBA,      Tokens.SYN,    ChainId.ETH,       Tokens.SYN,  true),
                makeTestCase(ChainId.ETH,       Tokens.SYN,    ChainId.BOBA,      Tokens.SYN,  true),
                makeTestCase(ChainId.BOBA,      Tokens.SYN,    ChainId.ETH,       Tokens.NUSD, false),
                makeTestCase(ChainId.ETH,       Tokens.NUSD,   ChainId.BOBA,      Tokens.NUSD, true),
                makeTestCase(ChainId.ETH,       Tokens.SYN,    ChainId.MOONRIVER, Tokens.SYN,  true),
                makeTestCase(ChainId.ETH,       Tokens.NUSD,   ChainId.MOONRIVER, Tokens.FRAX, false),
                makeTestCase(ChainId.MOONRIVER, Tokens.FRAX,   ChainId.ETH,       Tokens.FRAX, true),
                makeTestCase(ChainId.ETH,       Tokens.FRAX,   ChainId.MOONRIVER, Tokens.FRAX, true),
                makeTestCase(ChainId.ETH,       Tokens.ETH,    ChainId.OPTIMISM,  Tokens.NETH, true),
                makeTestCase(ChainId.ETH,       Tokens.ETH,    ChainId.OPTIMISM,  Tokens.ETH,  true),
                makeTestCase(ChainId.OPTIMISM,  Tokens.ETH,    ChainId.ETH,       Tokens.ETH,  true),
                makeTestCase(ChainId.OPTIMISM,  Tokens.ETH,    ChainId.ETH,       Tokens.NETH, true),
                makeTestCase(ChainId.AURORA,    Tokens.USDT,   ChainId.BSC,       Tokens.USDC, true),
                makeTestCase(ChainId.ETH,       Tokens.ETH,    ChainId.AURORA,    Tokens.USDC, false),
                makeTestCase(ChainId.ETH,       Tokens.NETH,   ChainId.AURORA,    Tokens.USDC, false),
                makeTestCase(ChainId.AVALANCHE, Tokens.WETH_E, ChainId.AURORA,    Tokens.USDC, false),
            ];

            testCases.forEach(({ args, expected }) => {
                const {
                    tokenFrom: { symbol: tokenFromSymbol },
                    tokenTo: { symbol: tokenToSymbol},
                    chainIdFrom,
                    chainIdTo
                } = args;

                const
                    netNameFrom = Networks.fromChainId(chainIdFrom).name,
                    netNameTo = Networks.fromChainId(chainIdTo).name

                const testTitle = `checkSwapSupported with params ${tokenFromSymbol} on ${netNameFrom} to ${tokenToSymbol} on ${netNameTo} should return ${expected}`

                it(testTitle, function() {
                    let { chainIdFrom, ...testArgs } = args;
                    const bridgeInstance = new Bridge.SynapseBridge({ network: chainIdFrom });
                    const [swapAllowed, errReason] = bridgeInstance.swapSupported(testArgs);
                    expect(swapAllowed).to.equal(expected, errReason);
                })
            })
        })

        describe("getEstimatedBridgeOutput", function(this: Mocha.Suite) {
            this.timeout(30*1000);

            interface TestArgs {
                chainIdFrom: number,
                chainIdTo:   number,
                tokenFrom:   Token,
                tokenTo:     Token,
                amountFrom:  BigNumber,
            }

            interface TestCase {
                args:      TestArgs,
                notZero:   boolean,
                wantError: boolean,
            }

            const makeSimpleTestCase = (amt: string): TestArgs => {
                return {
                    chainIdFrom: ChainId.ETH,
                    tokenFrom:   Tokens.DAI,
                    chainIdTo:   ChainId.BSC,
                    tokenTo:     Tokens.USDC,
                    amountFrom:  Tokens.DAI.valueToWei(amt, ChainId.ETH)
                }
            }

            let testCases: TestCase[] = [
                {
                    args:      makeSimpleTestCase("500"),
                    notZero:   true,
                    wantError: false
                },
                {
                    args:      makeSimpleTestCase("50"),
                    notZero:   true,
                    wantError: false
                },
                {
                    args:      makeSimpleTestCase("1"),
                    notZero:   false,
                    wantError: false
                },
                {
                    args: {
                        chainIdFrom: ChainId.BOBA,
                        chainIdTo:   ChainId.ETH,
                        tokenFrom:   Tokens.NETH,
                        tokenTo:     Tokens.ETH,
                        amountFrom:  Tokens.NETH.valueToWei("555", ChainId.BOBA),
                    },
                    notZero:   false,
                    wantError: true
                },
                {
                    args: {
                        chainIdFrom: ChainId.BOBA,
                        chainIdTo:   ChainId.ETH,
                        tokenFrom:   Tokens.NETH,
                        tokenTo:     Tokens.NETH,
                        amountFrom:  Tokens.NETH.valueToWei("555", ChainId.BOBA),
                    },
                    notZero:   false,
                    wantError: true,
                },
                {
                    args: {
                        chainIdFrom: ChainId.BOBA,
                        chainIdTo:   ChainId.BSC,
                        tokenFrom:   Tokens.USDC,
                        tokenTo:     Tokens.NUSD,
                        amountFrom:  Tokens.USDC.valueToWei("20", ChainId.BOBA),
                    },
                    notZero:   true,
                    wantError: false,
                },
                {
                    args: {
                        chainIdFrom: ChainId.BSC,
                        chainIdTo:   ChainId.BOBA,
                        tokenFrom:   Tokens.USDC,
                        tokenTo:     Tokens.USDT,
                        amountFrom:  Tokens.USDC.valueToWei("500", ChainId.BSC),
                    },
                    notZero:   true,
                    wantError: false,
                },
                {
                    args: {
                        chainIdFrom: ChainId.MOONRIVER,
                        chainIdTo:   ChainId.ETH,
                        tokenFrom:   Tokens.FRAX,
                        tokenTo:     Tokens.FRAX,
                        amountFrom:  Tokens.FRAX.valueToWei("250", ChainId.MOONRIVER),
                    },
                    notZero:   true,
                    wantError: false,
                },
                {
                    args: {
                        chainIdFrom: ChainId.ETH,
                        chainIdTo:   ChainId.MOONRIVER,
                        tokenFrom:   Tokens.FRAX,
                        tokenTo:     Tokens.FRAX,
                        amountFrom:  Tokens.FRAX.valueToWei("250", ChainId.ETH),
                    },
                    notZero:   true,
                    wantError: false,
                },
                {
                    args: {
                        chainIdFrom: ChainId.MOONRIVER,
                        chainIdTo:   ChainId.ETH,
                        tokenFrom:   Tokens.SYN,
                        tokenTo:     Tokens.SYN,
                        amountFrom:  Tokens.SYN.valueToWei("250", ChainId.MOONRIVER),
                    },
                    notZero:   true,
                    wantError: false,
                },
                {
                    args: {
                        chainIdFrom: ChainId.ETH,
                        chainIdTo:   ChainId.MOONRIVER,
                        tokenFrom:   Tokens.SYN,
                        tokenTo:     Tokens.SYN,
                        amountFrom:  Tokens.SYN.valueToWei("250", ChainId.ETH),
                    },
                    notZero:   true,
                    wantError: false,
                },
                {
                    args: {
                        chainIdFrom: ChainId.OPTIMISM,
                        chainIdTo:   ChainId.ETH,
                        tokenFrom:   Tokens.NETH,
                        tokenTo:     Tokens.NETH,
                        amountFrom:  Tokens.NETH.valueToWei("250", ChainId.OPTIMISM),
                    },
                    notZero:   true,
                    wantError: false,
                },
                {
                    args: {
                        chainIdFrom: ChainId.ETH,
                        chainIdTo:   ChainId.OPTIMISM,
                        tokenFrom:   Tokens.ETH,
                        tokenTo:     Tokens.NETH,
                        amountFrom:  Tokens.NETH.valueToWei("2500", ChainId.ETH),
                    },
                    notZero:   true,
                    wantError: false,
                },
                {
                    args: {
                        chainIdFrom: ChainId.ETH,
                        chainIdTo:   ChainId.AVALANCHE,
                        tokenFrom:   Tokens.ETH,
                        tokenTo:     Tokens.NETH,
                        amountFrom:  Tokens.ETH.valueToWei("4200", ChainId.ETH),
                    },
                    notZero:   true,
                    wantError: false,
                },
                {
                    args: {
                        chainIdFrom: ChainId.AVALANCHE,
                        chainIdTo:   ChainId.ETH,
                        tokenFrom:   Tokens.WETH_E,
                        tokenTo:     Tokens.USDC,
                        amountFrom:  Tokens.WETH_E.valueToWei("2500", ChainId.AVALANCHE),
                    },
                    notZero:   false,
                    wantError: true,
                },
                {
                    args: {
                        chainIdFrom: ChainId.AVALANCHE,
                        chainIdTo:   ChainId.ETH,
                        tokenFrom:   Tokens.WETH_E,
                        tokenTo:     Tokens.ETH,
                        amountFrom:  Tokens.WETH_E.valueToWei("2500", ChainId.AVALANCHE),
                    },
                    notZero:   true,
                    wantError: false,
                },
                {
                    args: {
                        chainIdFrom: ChainId.AVALANCHE,
                        chainIdTo:   ChainId.ARBITRUM,
                        tokenFrom:   Tokens.WETH_E,
                        tokenTo:     Tokens.ETH,
                        amountFrom:  Tokens.WETH_E.valueToWei("420", ChainId.AVALANCHE),
                    },
                    notZero:   true,
                    wantError: false,
                },
                {
                    args: {
                        chainIdFrom: ChainId.ETH,
                        chainIdTo:   ChainId.AVALANCHE,
                        tokenFrom:   Tokens.ETH,
                        tokenTo:     Tokens.WETH_E,
                        amountFrom:  Tokens.ETH.valueToWei("123", ChainId.ETH),
                    },
                    notZero:   true,
                    wantError: false,
                },
                {
                    args: {
                        chainIdFrom: ChainId.ETH,
                        chainIdTo:   ChainId.ETH,
                        tokenFrom:   Tokens.ETH,
                        tokenTo:     Tokens.WETH_E,
                        amountFrom:  Tokens.ETH.valueToWei("101", ChainId.ETH),
                    },
                    notZero:   true,
                    wantError: true,
                },
                {
                    args: {
                        chainIdFrom: ChainId.AVALANCHE,
                        chainIdTo:   ChainId.ETH,
                        tokenFrom:   Tokens.NUSD,
                        tokenTo:     Tokens.DAI,
                        amountFrom:  Tokens.NUSD.valueToWei("1337", ChainId.AVALANCHE),
                    },
                    notZero:   true,
                    wantError: false,
                },
                {
                    args: {
                        chainIdFrom: ChainId.FANTOM,
                        chainIdTo:   ChainId.ETH,
                        tokenFrom:   Tokens.MIM,
                        tokenTo:     Tokens.NUSD,
                        amountFrom:  Tokens.NUSD.valueToWei("1337", ChainId.BOBA),
                    },
                    notZero:   true,
                    wantError: false,
                },
                {
                    args: {
                        chainIdFrom: ChainId.AVALANCHE,
                        chainIdTo:   ChainId.POLYGON,
                        tokenFrom:   Tokens.NUSD,
                        tokenTo:     Tokens.DAI,
                        amountFrom:  Tokens.NUSD.valueToWei("1337", ChainId.AVALANCHE),
                    },
                    notZero:   true,
                    wantError: false,
                },
                {
                    args: {
                        chainIdFrom: ChainId.POLYGON,
                        chainIdTo:   ChainId.ETH,
                        tokenFrom:   Tokens.DOG,
                        tokenTo:     Tokens.DOG,
                        amountFrom:  Tokens.DOG.valueToWei("609", ChainId.POLYGON),
                    },
                    notZero:   true,
                    wantError: false,
                },
                {
                    args: {
                        chainIdFrom: ChainId.ARBITRUM,
                        chainIdTo:   ChainId.OPTIMISM,
                        tokenFrom:   Tokens.ETH,
                        tokenTo:     Tokens.ETH,
                        amountFrom:  Tokens.ETH.valueToWei("31337", ChainId.ARBITRUM),
                    },
                    notZero:   true,
                    wantError: false,
                },
                {
                    args: {
                        chainIdFrom: ChainId.ARBITRUM,
                        chainIdTo:   ChainId.OPTIMISM,
                        tokenFrom:   Tokens.NETH,
                        tokenTo:     Tokens.ETH,
                        amountFrom:  Tokens.NETH.valueToWei("31337", ChainId.ARBITRUM),
                    },
                    notZero:   true,
                    wantError: false,
                },
                {
                    args: {
                        chainIdFrom: ChainId.FANTOM,
                        chainIdTo:   ChainId.BSC,
                        tokenFrom:   Tokens.JUMP,
                        tokenTo:     Tokens.JUMP,
                        amountFrom:  Tokens.JUMP.valueToWei("31337", ChainId.FANTOM),
                    },
                    notZero:   true,
                    wantError: false,
                },
                {
                    args: {
                        chainIdFrom: ChainId.AVALANCHE,
                        chainIdTo:   ChainId.OPTIMISM,
                        tokenFrom:   Tokens.GOHM,
                        tokenTo:     Tokens.GOHM,
                        amountFrom:  Tokens.GOHM.valueToWei("1", ChainId.AVALANCHE),
                    },
                    notZero:   false,
                    wantError: true,   
                },
                {
                    args: {
                        chainIdFrom: ChainId.ETH,
                        chainIdTo:   ChainId.AVALANCHE,
                        tokenFrom:   Tokens.GOHM,
                        tokenTo:     Tokens.GOHM,
                        amountFrom:  Tokens.GOHM.valueToWei("69", ChainId.ETH),
                    },
                    notZero:   true,
                    wantError: false,   
                },
                {
                    args: {
                        chainIdFrom: ChainId.AURORA,
                        chainIdTo:   ChainId.AVALANCHE,
                        tokenFrom:   Tokens.USDC,
                        tokenTo:     Tokens.USDC,
                        amountFrom:  Tokens.USDC.valueToWei("69", ChainId.AURORA),
                    },
                    notZero:   true,
                    wantError: false,
                },
                {
                    args: {
                        chainIdFrom: ChainId.BSC,
                        chainIdTo:   ChainId.AURORA,
                        tokenFrom:   Tokens.USDC,
                        tokenTo:     Tokens.NUSD,
                        amountFrom:  Tokens.USDC.valueToWei("69", ChainId.BSC),
                    },
                    notZero:   true,
                    wantError: false,
                },
                {
                    args: {
                        chainIdFrom: ChainId.AURORA,
                        chainIdTo:   ChainId.ETH,
                        tokenFrom:   Tokens.USDC,
                        tokenTo:     Tokens.NUSD,
                        amountFrom:  Tokens.USDC.valueToWei("69", ChainId.AURORA),
                    },
                    notZero:   false,
                    wantError: false,
                },
                {
                    args: {
                        chainIdFrom: ChainId.AURORA,
                        chainIdTo:   ChainId.ETH,
                        tokenFrom:   Tokens.USDC,
                        tokenTo:     Tokens.NUSD,
                        amountFrom:  Tokens.USDC.valueToWei("669", ChainId.AURORA),
                    },
                    notZero:   true,
                    wantError: false,
                },
                {
                    args: {
                        chainIdFrom: ChainId.ETH,
                        chainIdTo:   ChainId.AURORA,
                        tokenFrom:   Tokens.USDC,
                        tokenTo:     Tokens.NUSD,
                        amountFrom:  Tokens.USDC.valueToWei("669", ChainId.ETH),
                    },
                    notZero:   true,
                    wantError: false,
                },
            ];

            testCases.forEach(({ args, notZero, wantError }) => {
                this.timeout(10*1000);

                const {
                    tokenFrom: { symbol: tokenFromSymbol },
                    tokenTo: { symbol: tokenToSymbol},
                    chainIdFrom,
                    chainIdTo,
                } = args;

                const
                    netNameFrom = Networks.fromChainId(chainIdFrom).name,
                    netNameTo = Networks.fromChainId(chainIdTo).name

                const
                    titleSuffix = notZero ? "a value greater than zero" : "a value === zero",
                    testTitle = `getEstimatedBridgeOutput with params ${tokenFromSymbol} on ${netNameFrom} to ${tokenToSymbol} on ${netNameTo} should return ${titleSuffix}`,
                    titleSuffix1 =  wantError ? "should fail" : "should pass",
                    testTitle1 = `buildBridgeTokenTransaction with params ${tokenFromSymbol} on ${netNameFrom} to ${tokenToSymbol} on ${netNameTo} ${titleSuffix1}`

                let amountTo: BigNumber;

                it(testTitle, function(done: Done) {
                    let { chainIdFrom, ...testArgs } = args;
                    const bridgeInstance = new Bridge.SynapseBridge({ network: chainIdFrom });

                    let prom: Promise<boolean> = bridgeInstance.estimateBridgeTokenOutput(testArgs).then((res): boolean => {
                        amountTo = res.amountToReceive;

                        return notZero
                            ? amountTo.gt(0)
                            : amountTo.isZero()
                        }   
                    )

                    wantError
                        ? expect(prom).to.eventually.be.rejected.notify(done)
                        : expect(prom).to.eventually.be.true.notify(done)
                })

                it(testTitle1, function(done: Done) {
                    this.timeout(10*1000);

                    if (!wantError) {
                        const bridgeInstance = new Bridge.SynapseBridge({ network: chainIdFrom });
                        const wallet = makeWalletSignerWithProvider(chainIdFrom, bridgeTestPrivkey);
                        const addressTo = wallet.address;
                        
                        Promise.resolve(
                            bridgeInstance.buildBridgeTokenTransaction({
                                ...args, amountTo, addressTo
                            })
                        ).catch((e) => doneWithError(e, done));
                    }

                    done();
                })
            })
        })
    })

    describe.skip("bridge tokens tests", async function(this: Mocha.Suite) {
        const
            tokenFrom      = Tokens.ETH,
            tokenTo        = Tokens.ETH,
            chainIdFrom    = ChainId.ETH,
            chainIdTo      = ChainId.OPTIMISM,
            amountFrom     = parseEther("0.022"),
            bridgeArgs     = {tokenFrom, tokenTo, chainIdFrom, chainIdTo, amountFrom},
            wallet         = makeWalletSignerWithProvider(chainIdFrom, bridgeTestPrivkey),
            addressTo      = await wallet.getAddress(),
            bridgeInstance = new Bridge.SynapseBridge({ network: chainIdFrom });

        let
            outputEstimate: Bridge.BridgeOutputEstimate,
            doBridgeArgs: Bridge.BridgeTransactionParams;

        async function getBridgeEstimate(this: Mocha.Context, done: Done) {
            bridgeInstance.estimateBridgeTokenOutput(bridgeArgs)
                .then((res) => {
                    if (res.amountToReceive.gt(Zero)) {
                        expect(res.amountToReceive.gt(Zero)).true;
                        outputEstimate = res;
                        doBridgeArgs = {
                            ...bridgeArgs,
                            amountFrom,
                            amountTo:  outputEstimate.amountToReceive,
                            addressTo,
                        }
                        done();
                    } else {
                        doneWithError(`wanted gt zero, got zero`, done);
                    }
                })
                .catch((e) => doneWithError(e, done))
        }

        describe.skip("test using transaction builders", function(this: Mocha.Suite) {
            let
                approvalTxn:     PopulatedTransaction,
                bridgeTxn:       PopulatedTransaction,
                approvalTxnHash: string,
                bridgeTxnHash:   string;

            step("should return an output estimate greater than zero", getBridgeEstimate);

            step("approval transaction should be populated successfully", async function(this: Mocha.Context, done: Done) {
                if (tokenFrom.isEqual(Tokens.ETH)) {
                    done();
                    return
                }
                this.timeout(5*1000);

                try {
                    approvalTxn = await bridgeInstance.buildApproveTransaction({token: tokenFrom});
                    done();
                } catch (e) {
                    doneWithError(e, done);
                }
            })

            step("approval transaction should be sent successfully", async function(this: Mocha.Context, done: Done) {
                if (tokenFrom.isEqual(Tokens.ETH)) {
                    done();
                    return
                }
                this.timeout(180*1000);

                let txn: TransactionResponse;

                try {
                    txn = await wallet.sendTransaction(approvalTxn);
                } catch (e) {
                    doneWithError(e, done);
                }

                approvalTxnHash = txn.hash;
                // console.log(`Approve transaction sent, pending hash: ${approvalTxnHash}`);
                await txn.wait(1);
                // console.log(`Approve transaction success!`);

                done();
            })

            step("bridge transaction should be populated successfully", async function(this: Mocha.Context, done: Done) {
                this.timeout(5*1000);

                try {
                    bridgeTxn = await bridgeInstance.buildBridgeTokenTransaction(doBridgeArgs);
                    done();
                } catch (e) {
                    doneWithError(e, done);
                }
            })

            step("bridge transaction should complete sucessfully", async function(this: Mocha.Context, done: Done) {
                this.timeout(180*1000);

                let txn: TransactionResponse;

                try {
                    txn = await wallet.sendTransaction(bridgeTxn);
                } catch (e) {
                    doneWithError(e, done);
                }

                bridgeTxnHash = txn.hash;
                // console.log(`Bridge transaction sent, pending hash: ${bridgeTxnHash}`);
                await txn.wait(1);
                // console.log(`Bridge txn success!`);

                done();
            })
        })

        describe.skip("magic executors", function(this: Mocha.Suite) {
            step("should return an output estimate greater than zero", getBridgeEstimate);

            step("should successfully approve", async function(this: Mocha.Context, done: Done) {
                this.timeout(180*1000);

                let txn: TransactionResponse;

                try {
                    txn = await bridgeInstance.executeApproveTransaction({token: tokenFrom}, wallet);
                } catch (e) {
                    doneWithError(e, done);
                }

                await txn.wait(1);
                // console.log(`spend approved at txhash ${txn.hash}`);

                done();
            })

            step("should successfully bridge tokens", async function(this: Mocha.Context, done: Done) {
                this.timeout(180*1000);

                let txn: TransactionResponse;

                try {
                    txn = await bridgeInstance.executeBridgeTokenTransaction(doBridgeArgs, wallet);
                } catch (e) {
                    doneWithError(e, done);
                }

                await txn.wait(1);
                // console.log(`Bridge txn success! Hash: ${txn.hash}`);

                done();
            })
        })

    })
})