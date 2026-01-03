import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load .env.local manually since we are running with node
const envLocalPath = path.resolve(process.cwd(), '.env.local')
const envConfig = dotenv.parse(fs.readFileSync(envLocalPath))

const supabaseUrl = envConfig.VITE_SUPABASE_URL
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY

console.log('Testing Supabase Connection...')
console.log('URL:', supabaseUrl)
console.log('Key Length:', supabaseKey ? supabaseKey.length : 0)

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
    try {
        const { data, error } = await supabase.from('users').select('count').limit(1).single()

        if (error) {
            console.error('❌ Connection Failed:', error.message, error.code)
            if (error.code === 'PGRST301') console.error('  -> Hint: Potential Revoked Key or Database Paused')
        } else {
            console.log('✅ Connection Successful! Data received.')
        }
    } catch (err) {
        console.error('❌ Unexpected Error:', err)
    }
}

testConnection()
