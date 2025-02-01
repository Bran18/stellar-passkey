import { useEffect, useRef, useState } from "react";
import { Horizon, Keypair } from "@stellar/stellar-sdk";
import { ENV } from "@/app/libs/env";
import type { RegistrationResponseJSON } from "@simplewebauthn/browser";
import { getPublicKeys } from "@/app/libs/stellar";
import { handleDeploy } from "../../app/libs/deploy";
import { handleVoteBuild } from "@/app/libs/vote_build";
import { handleVoteSend } from "@/app/libs/vote_send";
import { getVotes } from "@/app/libs/get_votes";
import base64url from "base64url";
import type { PresignData, SignParams } from "./types";

const { HORIZON_URL } = ENV;

const getStoredDeployee = () => {
	return localStorage.getItem("sp:deployee");
};

const setStoredDeployee = (deployee: string) => {
	localStorage.setItem("sp:deployee", deployee);
};

const removeStoredDeployee = () => {
	localStorage.removeItem("sp:deployee");
};

const getStoredBundler = () => {
	return localStorage.getItem("sp:bundler");
};

const setStoredBundler = (bundler: string) => {
	localStorage.setItem("sp:bundler", bundler);
};

const removeStoredBundler = () => {
	localStorage.removeItem("sp:bundler");
};

const setStoredCredentialId = (credentials: string) => {
	localStorage.setItem("sp:id", credentials);
};

const removeStoredCredentialId = () => {
	localStorage.removeItem("sp:id");
};

const onVotes = async (bundlerKey: Keypair, deployee: string) => {
	if (bundlerKey && deployee) {
		const votes = await getVotes(bundlerKey, deployee);
		console.log("--- votes ---", votes);
		return votes;
	}
};

export const useStellar = () => {
	// Manages Stellar operations such as deploying contracts and signing transactions
	const [loadingDeployee, setLoadingDeployee] = useState(true);
	const [deployee, setDeployee] = useState<string | null>(null);
	const bundlerKey = useRef<Keypair | null>(null);
	const [loadingRegister, setLoadingRegister] = useState(false);
	const [loadingSign, setLoadingSign] = useState(false);
	const [contractData, setContractData] = useState<any | null>(null); // Just for testing

	const onRegister = async (registerRes: RegistrationResponseJSON) => {
		// Handles registration with Stellar by deploying a contract
		if (deployee) return;
		try {
			setLoadingRegister(true);
			setStoredCredentialId(registerRes.id);
			const { contractSalt, publicKey } = await getPublicKeys(registerRes);
			if (!bundlerKey.current) throw new Error("Bundler key not found");
			if (!contractSalt || !publicKey) throw new Error("Invalid public keys");
			const deployee = await handleDeploy(
				bundlerKey.current,
				contractSalt,
				publicKey,
			);
			console.log({ deployee });
			setStoredDeployee(deployee);
			setDeployee(deployee);
		} catch (error) {
			console.error(error);
		} finally {
			setLoadingRegister(false);
		}
	};

	const prepareSign = async (): Promise<PresignData> => {
		// Prepares data for signing a transaction on the Stellar network
		if (!bundlerKey.current) throw new Error("Bundler key not found");
		if (!deployee) throw new Error("Deployee not found");
		const { authTxn, authHash, lastLedger } = await handleVoteBuild(
			bundlerKey.current.publicKey(),
			deployee,
			true, // Response to vote for chicken, for demo purposes
		);
		const base64urlAuthHash = base64url(authHash);
		return { authTxn, base64urlAuthHash, lastLedger };
	};

	const onSign = async ({ signRes, authTxn, lastLedger }: SignParams) => {
		// Handles the signing of a transaction and sends it to the Stellar network
		try {
			setLoadingSign(true);
			if (!bundlerKey.current) throw new Error("Bundler key not found");
			if (!deployee) throw new Error("Deployee not found");
			await handleVoteSend(bundlerKey.current, authTxn, lastLedger, signRes);
			const votes = await onVotes(bundlerKey.current, deployee);
			setContractData(votes);
		} catch (error) {
			console.error(error);
		} finally {
			setLoadingSign(false);
		}
	};

	const reset = () => {
		removeStoredDeployee();
		removeStoredBundler();
		removeStoredCredentialId();
	};

	useEffect(() => {
		const init = async () => {
			try {
				console.log("Loading deployee started:", loadingDeployee);
				const storedBundler = getStoredBundler();
				if (storedBundler) {
					bundlerKey.current = Keypair.fromSecret(storedBundler);
				} else {
					bundlerKey.current = Keypair.random();
					setStoredBundler(bundlerKey.current.secret());
					const horizon = new Horizon.Server(HORIZON_URL);
					await horizon.friendbot(bundlerKey.current.publicKey()).call();
				}

				const storedDeployee = getStoredDeployee();
				if (storedDeployee) {
					setDeployee(storedDeployee);
				}
			} catch (error) {
				console.error(error);
			} finally {
				setLoadingDeployee(false);
				console.log("Loading deployee ended:", loadingDeployee);
			}
		};

		init();
	}, []);

	return {
		onRegister,
		onSign,
		prepareSign,
		deployee,
		loadingRegister,
		loadingSign,
		loadingDeployee,
		contractData,
		reset,
	};
};
