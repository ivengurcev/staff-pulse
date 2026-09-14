import { createGlobalStyle } from 'styled-components'

export const GlobalStyle = createGlobalStyle`
    *,
    *::before,
    *::after {
        box-sizing: border-box;
    }

    html {
        min-width: 320px;
        min-height: 100%;
        background: #f5f7fb;
    }

    body {
        min-width: 320px;
        min-height: 100vh;
        margin: 0;
        background:
            radial-gradient(circle at top left, rgb(99 102 241 / 9%), transparent 30rem),
            #f5f7fb;
        color: #344054;
        font-family:
            Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
        -webkit-font-smoothing: antialiased;
    }

    button,
    input {
        font: inherit;
    }
`
