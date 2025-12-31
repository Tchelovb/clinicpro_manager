/** @type {import('tailwindcss').Config} */
export default {
	content: [
		"./index.html",
		"./src/**/*.{js,ts,jsx,tsx}",
		"./components/**/*.{js,ts,jsx,tsx}",
		"./pages/**/*.{js,ts,jsx,tsx}",
		"./contexts/**/*.{js,ts,jsx,tsx}",
		"./*.{js,ts,jsx,tsx}",
	],
	darkMode: "class",
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px",
			},
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',

				// --- CORES SEMÂNTICAS (ClinicPro Design System) ---
				primary: {
					DEFAULT: "#2563EB", // blue-600 (Ação Principal)
					foreground: "#FFFFFF",
					light: "#EFF6FF", // blue-50
					dark: "#1D4ED8", // blue-700
				},
				secondary: {
					DEFAULT: "#F8FAFC", // slate-50
					foreground: "#1E293B", // slate-800
				},
				success: {
					DEFAULT: "#10B981", // green-500
					foreground: "#FFFFFF",
					light: "#ECFDF5", // green-50
				},
				warning: {
					DEFAULT: "#F59E0B", // amber-500
					foreground: "#FFFFFF",
					light: "#FFFBEB", // amber-50
				},
				destructive: {
					DEFAULT: "#EF4444", // red-500
					foreground: "#FFFFFF",
					light: "#FEF2F2", // red-50
				},
				muted: {
					DEFAULT: "#F1F5F9", // slate-100
					foreground: "#64748B", // slate-500
				},
				accent: {
					DEFAULT: "#F1F5F9",
					foreground: "#0F172A",
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				// Padrão Apple (Curvas suaves)
				xl: "1rem",
				'2xl': "1.5rem",
				'3xl': "2rem",
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
};
