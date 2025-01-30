import type { AuthenticationResponseJSON } from "@simplewebauthn/browser";
import type {
	Memo,
	Operation,
	Transaction,
	MemoType,
} from "@stellar/stellar-sdk";

export type SignParams = {
	signRes: AuthenticationResponseJSON;
	authTxn: Transaction<Memo<MemoType>, Operation[]>;
	lastLedger: number;
};

export type PresignData = {
	authTxn: Transaction<Memo<MemoType>, Operation[]>;
	base64urlAuthHash: string;
	lastLedger: number;
};
