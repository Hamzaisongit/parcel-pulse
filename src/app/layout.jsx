import Loading from '../Components/Loading';
import { GlobalContextProvider } from '../Context/globalContext';
import './globals.css';


export default function RootLayout({ children }) {
    return (
        <html suppressHydrationWarning lang="en">
            <body>
                <GlobalContextProvider>
                    {children}
                    <Loading></Loading>
                </GlobalContextProvider>
            </body>
        </html>
    );
}