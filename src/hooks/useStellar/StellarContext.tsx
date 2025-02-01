"use client";
import { createContext, useContext, type ReactNode } from "react";
import { useStellar } from "@/hooks/useStellar/useStellar";

type StellarContextProps = ReturnType<typeof useStellar>;

const StellarContext = createContext<StellarContextProps | undefined>(
	undefined,
);

export function StellarProvider({ children }: { children: ReactNode }) {
	const stellar = useStellar();
	return (
		<StellarContext.Provider value={stellar}>
			{children}
		</StellarContext.Provider>
	);
}

export const useStellarContext = () => {
	const context = useContext(StellarContext);
	if (!context) {
		throw new Error("useStellarContext must be used within a StellarProvider");
	}
	return context;
};
