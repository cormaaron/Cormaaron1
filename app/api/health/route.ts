export async function GET() {
  return Response.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'MISSING',
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'MISSING',
    openaiKey: process.env.OPENAI_API_KEY ? 'set' : 'MISSING',
  })
}
