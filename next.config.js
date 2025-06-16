/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/v2/:path*',
                destination: 'https://mycompany404.erpnext.com/api/v2/:path*'
            }
        ]
    }
}

module.exports = nextConfig