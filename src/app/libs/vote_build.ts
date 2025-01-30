import { ENV } from "@/app/libs/env";

import type { Keypair } from "@stellar/stellar-sdk";
import {
	Account,
	SorobanRpc,
	TransactionBuilder,
	xdr,
	Operation,
	Address,
	hash,
} from "@stellar/stellar-sdk";

const { RPC_URL, NETWORK_PASSPHRASE, CHICKEN_VS_EGG_CONTRACT_ID } = ENV;

export const handleVoteBuild = async (
	bundlerPublicKey: string,
	accountContractId: string,
	vote: boolean,
) => {
	const rpc = new SorobanRpc.Server(RPC_URL);
	const lastLedger = await rpc
		.getLatestLedger()
		.then(({ sequence }) => sequence);
	const bundlerKeyAccount = await rpc
		.getAccount(bundlerPublicKey)
		.then((res) => new Account(res.accountId(), res.sequenceNumber()));

	const simTxn = new TransactionBuilder(bundlerKeyAccount, {
		fee: "0",
		networkPassphrase: NETWORK_PASSPHRASE,
	})
		.addOperation(
			Operation.invokeContractFunction({
				contract: CHICKEN_VS_EGG_CONTRACT_ID,
				function: "vote",
				args: [
					Address.fromString(accountContractId).toScVal(),
					xdr.ScVal.scvBool(vote),
				],
			}),
		)
		.setTimeout(0)
		.build();

	const sim = await rpc.simulateTransaction(simTxn);

	if (
		SorobanRpc.Api.isSimulationError(sim) ||
		SorobanRpc.Api.isSimulationRestore(sim)
	)
		throw sim;

	const authTxn = SorobanRpc.assembleTransaction(simTxn, sim).build();
	const auth = sim.result?.auth[0];
	if (!auth) throw new Error("No auth found");
	const authHash = hash(
		xdr.HashIdPreimage.envelopeTypeSorobanAuthorization(
			new xdr.HashIdPreimageSorobanAuthorization({
				networkId: hash(Buffer.from(NETWORK_PASSPHRASE, "utf-8")),
				nonce: auth.credentials().address().nonce(),
				signatureExpirationLedger: lastLedger + 100,
				invocation: auth.rootInvocation(),
			}),
		).toXDR(),
	);

	return {
		authTxn,
		authHash,
		lastLedger,
	};
};
