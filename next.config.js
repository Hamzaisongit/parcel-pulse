/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'https://mycompany404.erpnext.com/api/:path*'
            }
        ]
    }
}

module.exports = nextConfig