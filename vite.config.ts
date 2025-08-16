import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [
        laravel({
            input: ["resources/css/app.css", "resources/js/app.tsx"],
            refresh: true,
        }),
        react({
            jsxRuntime: "automatic",
            exclude: [/\/components\//],
        }),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            "@": "/resources/js",
        },
    },
    server: {
        proxy: {
            "/convert": "http://127.0.0.1:8000",
        },
    },
});
