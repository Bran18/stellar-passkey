"use client";

import * as React from "react";
import * as Form from "@radix-ui/react-form";
import { toast } from "sonner";
import { usePasskeyRegistration } from "../hooks/usePasskeyRegistration";
import { usePasskeyAuthentication } from "../hooks/usePasskeyAuthentication";
import { truncateAccount } from "@/app/libs/stellar";
import { browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboard, faBug } from "@fortawesome/free-solid-svg-icons";
import { useEffect } from "react";
import { useStellarContext } from "@/hooks/useStellar/StellarContext";
import { SignOutButton } from "./SignOutButton";
import { RedisDebug } from "@/app/libs/redis-debug";

// Import the type for Redis debug responses
import type { RedisDebugResponse } from "@/app/libs/redis-debug";

export const PasskeyDashboard = () => {
	const identifier = "test"; // Replace with actual identifier logic if needed
	const [isWebAuthnSupported, setIsWebAuthnSupported] = React.useState(false);
	const [showDebugPanel, setShowDebugPanel] = React.useState(false);
	const [debugData, setDebugData] = React.useState<RedisDebugResponse | null>(null);
	const [isLoading, setIsLoading] = React.useState(false);

	const {
		onRegister,
		onSign,
		deployee,
		loadingDeployee,
		prepareSign,
		contractData,
	} = useStellarContext();

	// Use the hooks
	const {
		isCreatingPasskey,
		regSuccess,
		regError,
		handleRegister,
		isRegistered,
		reset: resetReg,
	} = usePasskeyRegistration(identifier, { onRegister });

	const {
		isAuthenticating,
		authSuccess,
		authError,
		handleAuth,
		isAuthenticated,
		reset: resetAuth,
	} = usePasskeyAuthentication(identifier, { onSign, prepareSign });

	// State for action
	const [action, setAction] = React.useState<string | null>(null);

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!action) {
			console.error("Action is undefined");
			return;
		}

		toast(`Processing ${action}...`);

		if (action === "register") {
			resetReg();
			resetAuth();
			handleRegister();
		} else if (action === "verify") {
			resetAuth();
			resetReg();
			handleAuth();
		}
	};

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text).then(
			() => {
				toast("Copied to clipboard!");
			},
			(err) => {
				console.error("Could not copy text: ", err);
			},
		);
	};

	// Debug functions
	const showAllRedisKeys = async () => {
		setIsLoading(true);
		try {
			const data = await RedisDebug.getState();
			setDebugData(data);
			toast.success("Loaded Redis state");
		} catch (error) {
			console.error("Redis debug error:", error);
			toast.error("Error loading Redis state");
			setDebugData({ error: "Failed to load Redis state" });
		} finally {
			setIsLoading(false);
		}
	};

	const showChallengeKey = async () => {
		setIsLoading(true);
		try {
			await RedisDebug.logChallengeKeys();
			const data = await RedisDebug.getState();

			// Safe way to check for challenge keys
			if (data.state && Object.keys(data.state).length > 0) {
				const challengeKeys = Object.keys(data.state)
					.filter(key => key.startsWith("challenge:"));

				if (challengeKeys.length > 0) {
					const keyData = await RedisDebug.getKey(challengeKeys[0]);
					setDebugData(keyData);
					toast.success(`Found ${challengeKeys.length} challenge keys`);
				} else {
					setDebugData({ message: "No challenge keys found" });
					toast.info("No challenge keys found");
				}
			} else {
				setDebugData({ message: "No keys in Redis" });
				toast.info("No keys in Redis");
			}
		} catch (error) {
			console.error("Redis challenge key error:", error);
			toast.error("Error finding challenge keys");
			setDebugData({ error: "Failed to check challenge keys" });
		} finally {
			setIsLoading(false);
		}
	};

	const flushRedis = async () => {
		setIsLoading(true);
		try {
			const data = await RedisDebug.flushAll();
			setDebugData(data);
			toast.success("Redis data flushed");
		} catch (error) {
			console.error("Redis flush error:", error);
			toast.error("Error flushing Redis");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (!browserSupportsWebAuthn()) {
			setIsWebAuthnSupported(false);
		} else {
			setIsWebAuthnSupported(true);
		}
	}, []);

	useEffect(() => {
		// Add console access to debug functions - safely
		if (typeof window !== 'undefined') {
			try {
				// Type-safe access to window
				const w = window as Window & {
					redisDebug?: {
						getState: () => Promise<RedisDebugResponse>;
						logChallengeKeys: () => Promise<void>;
						flushAll: () => Promise<RedisDebugResponse>;
						getKey: (key: string) => Promise<RedisDebugResponse>;
					}
				};

				w.redisDebug = {
					getState: () => RedisDebug.getState().catch(err => ({ error: String(err) })),
					logChallengeKeys: () => RedisDebug.logChallengeKeys().catch(err => console.error(err)),
					flushAll: () => RedisDebug.flushAll().catch(err => ({ error: String(err) })),
					getKey: (key: string) => RedisDebug.getKey(key).catch(err => ({ error: String(err) }))
				};
				console.info("🪲 Redis debug functions available at window.redisDebug");
			} catch (error) {
				console.error("Could not add debug functions to window:", error);
			}
		}
	}, []);

	// Add debug panel to the UI
	const renderDebugPanel = () => {
		if (!showDebugPanel) return null;

		// Simpler debug panel that's less likely to crash
		return (
			<div className="mt-8 p-4 border border-gray-300 rounded-md bg-gray-50">
				<h3 className="text-lg font-semibold mb-4 text-purple-800">Redis Debug Panel</h3>

				<div className="space-y-4">
					<div>
						<p className="text-sm text-gray-600 mb-2">Basic Debug Operations:</p>
						<div className="flex space-x-4">
							<button
								type="button"
								className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
								onClick={() => {
									toast.info("Opening API debug in new tab");
									window.open("/api/redis-debug", "_blank");
								}}
							>
								View All Keys in API
							</button>

							<button
								type="button"
								className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
								onClick={() => {
									try {
										RedisDebug.flushAll()
											.then(() => toast.success("Redis data flushed"))
											.catch(err => {
												console.error(err);
												toast.error("Failed to flush Redis");
											});
									} catch (error) {
										console.error(error);
										toast.error("Error calling Redis flush");
									}
								}}
							>
								Flush Redis
							</button>
						</div>
					</div>

					<div>
						<p className="text-sm text-gray-600 mb-2">Challenge Key Debugging:</p>
						<div className="flex flex-col space-y-2">
							<div className="text-xs text-gray-500">
								Open browser console and type:
								<pre className="bg-gray-800 text-green-400 p-2 rounded-md mt-1 overflow-auto">
									window.redisDebug.logChallengeKeys()
								</pre>
							</div>

							<div className="text-xs text-gray-500">
								Or check a specific challenge key:
								<pre className="bg-gray-800 text-green-400 p-2 rounded-md mt-1 overflow-auto">
									window.redisDebug.getKey('challenge:localhost:test')
								</pre>
							</div>
						</div>
					</div>

					<div>
						<p className="text-sm text-gray-600">Test your Redis connection:</p>
						<div className="flex space-x-4 mt-2">
							<button
								type="button"
								className="px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors"
								onClick={() => {
									toast.info("Testing Redis connection...");
									window.open("/api/redis-test", "_blank");
								}}
							>
								Test Redis
							</button>

							<button
								type="button"
								className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
								onClick={() => {
									toast.info("Setting test data...");
									fetch("/api/redis-test", { method: "POST" })
										.then(r => r.json())
										.then(() => toast.success("Test data set"))
										.catch(() => toast.error("Failed to set test data"));
								}}
							>
								Set Test Data
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	};

	if (!isWebAuthnSupported) return <div>WebAuthn is not supported</div>;

	return (
		<div className="bg-white shadow-lg rounded-lg p-8 max-w-xl mx-auto">
			<div className="flex justify-between items-center mb-6">
				<h2 className="text-2xl font-bold text-indigo-800">
					Passkey Management
				</h2>
				<div className="flex items-center space-x-2">
					{process.env.NODE_ENV === "development" && (
						<button
							type="button"
							onClick={() => setShowDebugPanel(!showDebugPanel)}
							className="p-2 text-gray-500 hover:text-purple-700 transition-colors"
							aria-label="Toggle debug panel"
							title="Toggle Redis debug panel"
						>
							<FontAwesomeIcon icon={faBug} />
						</button>
					)}
					{deployee && <SignOutButton />}
				</div>
			</div>
			<Form.Root onSubmit={handleSubmit}>
				<Form.Field name="username">
					<Form.Label className="text-sm font-medium text-gray-700 mb-1 block">
						Username
					</Form.Label>
					<Form.Control asChild>
						<input
							className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm shadow-sm placeholder-black text-black
                         focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors duration-200"
							type="text"
							required
							value={identifier}
							readOnly
						/>
					</Form.Control>
					<Form.Message
						match="valueMissing"
						className="text-red-500 text-sm mt-1"
					>
						Please enter a username
					</Form.Message>
				</Form.Field>

				{deployee || loadingDeployee ? (
					<div className="mt-6 flex space-x-4 items-center">
						<p className="text-sm text-gray-500">
							{deployee
								? `Stellar Account: ${truncateAccount(deployee)}`
								: "Checking Stellar Account..."}
						</p>
						{deployee && (
							<button
								type="button"
								className="text-sm text-blue-500 hover:underline flex items-center"
								onClick={() => copyToClipboard(deployee)}
							>
								<FontAwesomeIcon icon={faClipboard} className="mr-1" />
								Copy
							</button>
						)}
					</div>
				) : null}
				{!loadingDeployee && (
					<div className="mt-6 flex space-x-4">
						{!deployee ? (
							<Form.Submit asChild>
								<button
									className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
									type="submit"
									onClick={() => setAction("register")}
									disabled={isCreatingPasskey}
								>
									{isCreatingPasskey ? "Registering..." : "Register Passkey"}
								</button>
							</Form.Submit>
						) : null}
						<Form.Submit asChild>
							<button
								className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors duration-200"
								type="submit"
								onClick={() => setAction("verify")}
								disabled={isAuthenticating}
							>
								{isAuthenticating
									? "Authenticating..."
									: !deployee
										? "Verify Passkey"
										: "Sign Transaction"}
							</button>
						</Form.Submit>
					</div>
				)}
			</Form.Root>
			{regSuccess && (
				<p className="mt-4 text-green-600 font-medium">{regSuccess}</p>
			)}
			{regError && <p className="mt-4 text-red-600 font-medium">{regError}</p>}
			{authSuccess && (
				<p className="mt-4 text-green-600 font-medium">{authSuccess}</p>
			)}
			{authError && (
				<p className="mt-4 text-red-600 font-medium">{authError}</p>
			)}
			{contractData && (
				<pre className="mt-4 text-green-600 font-medium">
					{JSON.stringify(contractData, null, 2)}
				</pre>
			)}
			{renderDebugPanel()}
		</div>
	);
};
