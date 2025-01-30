import { Header } from "@/components/Header";
import { PasskeyDashboard } from "@/components/PasskeyDashboard";
import { Toaster } from "sonner";

export default function Home() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100">
			<Toaster />
			<Header />
			<main className="container mx-auto px-4 py-12">
				<h1 className="text-4xl font-bold mb-8 text-center text-indigo-800">
					Passkey Authentication Dashboard
				</h1>
				<PasskeyDashboard />
			</main>
		</div>
	);
}
