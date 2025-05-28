'use client';

// Simple layout component with basic styling
export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <style>{`
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 20px;
                        background-color: #f5f5f5;
                    }
                    .container {
                        max-width: 1200px;
                        margin: 0 auto;
                        background-color: white;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .header {
                        margin-bottom: 20px;
                        padding-bottom: 10px;
                        border-bottom: 1px solid #eee;
                    }
                    .select-container {
                        margin: 20px 0;
                    }
                    select {
                        width: 100%;
                        padding: 8px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        font-size: 16px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }
                    th, td {
                        padding: 12px;
                        text-align: left;
                        border-bottom: 1px solid #ddd;
                    }
                    th {
                        background-color: #f8f9fa;
                    }
                    .loading {
                        text-align: center;
                        padding: 20px;
                        color: #666;
                    }
                    .error {
                        color: red;
                        padding: 10px;
                        background-color: #ffebee;
                        border-radius: 4px;
                        margin: 10px 0;
                    }
                `}</style>
            </head>
            <body>
                <div className="container">
                    {children}
                </div>
            </body>
        </html>
    );
} 