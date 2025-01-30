import { useState } from "react";
import {
	type RegistrationResponseJSON,
	startRegistration,
} from "@simplewebauthn/browser";
import { toast } from "sonner";
import { ErrorCode, InAppError } from "@/app/libs/errors";

export const usePasskeyRegistration = (
	identifier: string,
	{ onRegister }: { onRegister?: (res: RegistrationResponseJSON) => void },
) => {
	const [isCreatingPasskey, setIsCreatingPasskey] = useState<boolean>(false);
	const [regSuccess, setRegSuccess] = useState<string>("");
	const [regError, setRegError] = useState<string>("");

	const reset = () => {
		setIsCreatingPasskey(false);
		setRegSuccess("");
		setRegError("");
	};

	const handleRegister = async () => {
		setIsCreatingPasskey(true);
		setRegSuccess("");
		setRegError("");
		toast.info("Creando autenticación biométrica...");
		console.log("Creating passkey for", identifier);

		try {
			const registrationOptionsResp = await fetch(
				"api/generate-registration-options",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						identifier,
						origin: window.location.origin,
					}),
				},
			);
			if (!registrationOptionsResp.ok) {
				const opts = await registrationOptionsResp.json();
				throw new InAppError(ErrorCode.UNEXPECTED_ERROR, opts.error);
			}
			const registrationOptions = await registrationOptionsResp.json();

			console.log("Registration Options", registrationOptions);

			const registrationResponse = await startRegistration({
				optionsJSON: registrationOptions,
			});
			console.log("Registration Response", registrationResponse);

			const verificationResp = await fetch("api/verify-registration", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					registrationResponse,
					identifier,
					origin: window.location.origin,
				}),
			});

			if (!verificationResp.ok) {
				const verificationJSON = await verificationResp.json();
				throw new InAppError(
					ErrorCode.UNEXPECTED_ERROR,
					verificationJSON.error,
				);
			}

			const verificationJSON = await verificationResp.json();
			console.log("Server Response", verificationJSON);

			if (verificationJSON?.verified) {
				const message = "Authenticator registered!";
				setRegSuccess(message);
				toast.success(message);
				onRegister?.(registrationResponse);
			} else {
				const message = `Oh no, something went wrong! Response: ${JSON.stringify(verificationJSON)}`;
				setRegError(message);
				toast.error(message);
			}
		} catch (_error) {
			const error = _error as Error;
			if (error.name === "InvalidStateError") {
				const message =
					"Error: Authenticator was probably already registered by user";
				setRegError(message);
				toast.error(message);
			} else {
				let message = error.toString();
				if (
					error.message.includes(
						"The operation either timed out or was not allowed.",
					)
				) {
					message = "Operation cancelled or not allowed";
				}
				setRegError(message);
				toast.error(message);
			}
		} finally {
			setIsCreatingPasskey(false);
		}
	};

	return {
		isCreatingPasskey,
		regSuccess,
		regError,
		handleRegister,
		isRegistered: Boolean(regSuccess),
		reset,
	};
};
