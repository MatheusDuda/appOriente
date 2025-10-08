/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                primary:   "#6B4F35",
                secondary: "#E8DED6",
                background:"#F8F5F2",
                surface:   "#FFFFFF",
                text: {
                    primary:   "#3D332A",
                    secondary: "#7D756D",
                },
                divider: "#E6DFD8",
            },
            fontFamily: {
                sans: ["Poppins","Roboto","sans-serif"],
            },
            borderRadius: {
                lg: "10px",
                xl: "12px",
            },
            boxShadow: {
                card: "0 4px 12px rgba(0,0,0,0.06)",
            },
        },
    },
    plugins: [],
}
