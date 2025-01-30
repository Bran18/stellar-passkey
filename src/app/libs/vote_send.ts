import {
	type Memo,
	type Operation,
	SorobanRpc,
	type Transaction,
	xdr,
	type Keypair,
	type MemoType,
} from "@stellar/stellar-sdk";
import base64url from "base64url";
import { convertEcdsaSignatureAsnToCompact } from "@/app/libs/stellar";
import type { AuthenticationResponseJSON } from "@simplewebauthn/browser";
import { ENV } from "@/app/libs/env";

const { RPC_URL, HORIZON_URL } = ENV;

export const handleVoteSend = async (
	bundlerKey: Keypair,
	authTxn: Transaction<Memo<MemoType>, Operation[]>,
	lastLedger: number,
	signRes: AuthenticationResponseJSON,
) => {
	debugger;
	console.log("Sending vote");
	const rpc = new SorobanRpc.Server(RPC_URL);

	const signatureRaw = base64url.toBuffer(signRes.response.signature);
	const signature = convertEcdsaSignatureAsnToCompact(signatureRaw);

	const op = authTxn.operations[0] as Operation.InvokeHostFunction;
	const creds = op.auth?.[0].credentials().address();

	if (!creds) throw new Error("No creds found");

	creds.signatureExpirationLedger(lastLedger + 100);
	creds.signature(
		xdr.ScVal.scvMap([
			new xdr.ScMapEntry({
				key: xdr.ScVal.scvSymbol("authenticator_data"),
				val: xdr.ScVal.scvBytes(
					base64url.toBuffer(signRes.response.authenticatorData),
				),
			}),
			new xdr.ScMapEntry({
				key: xdr.ScVal.scvSymbol("client_data_json"),
				val: xdr.ScVal.scvBytes(
					base64url.toBuffer(signRes.response.clientDataJSON),
				),
			}),
			new xdr.ScMapEntry({
				key: xdr.ScVal.scvSymbol("signature"),
				val: xdr.ScVal.scvBytes(signature),
			}),
		]),
	);

	debugger;
	const sim = await rpc.simulateTransaction(authTxn);

	if (
		SorobanRpc.Api.isSimulationError(sim) ||
		SorobanRpc.Api.isSimulationRestore(sim)
	)
		throw sim;

	const transaction = SorobanRpc.assembleTransaction(authTxn, sim)
		.setTimeout(30)
		.build();

	transaction.sign(bundlerKey);

	const txResp = await (
		await fetch(`${HORIZON_URL}/transactions`, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({ tx: transaction.toXDR() }),
		})
	).json();

	if (txResp.successful) {
		console.log(txResp);
	} else {
		throw txResp;
	}
};
